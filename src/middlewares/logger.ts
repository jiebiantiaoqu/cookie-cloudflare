import path from 'path'
// import * as winston from 'winston'
// import DailyRotateFile from 'winston-daily-rotate-file'
import { getRuntimeKey } from 'hono/adapter'
import { logger as honoLogger } from 'hono/logger'
import { LOG_LEVEL, LOGFILES } from '@/env'

async function createLogger() {
    if (process.env.RUNTIME_KEY === 'cloudflare-workers' || getRuntimeKey() === 'workerd') {
        return console
    }
    const logDir = path.resolve('logs')
    const winston = await import('winston')
    const DailyRotateFile = (await import('winston-daily-rotate-file')).default

    const format = winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSSZ' }),
        winston.format.printf((info: any) => `[${info.timestamp}] ${info.level}: ${info.message}`),
    )

    const dailyRotateFileOption = {
        dirname: logDir,
        datePattern: 'YYYY-MM-DD',
        zippedArchive: false,
        maxSize: '20m',
        maxFiles: '31d',
        format,
        auditFile: path.join(logDir, '.audit.json'),
    }
    const winstonLogger = winston.createLogger({
        level: LOG_LEVEL,
        exitOnError: false,
        transports: [
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
                    winston.format.ms(),
                    winston.format.printf((info) => {
                        const infoLevel = winston.format.colorize().colorize(info.level, `[${info.timestamp}] ${info.level}`)
                        return `${infoLevel}: ${info.message}`
                    }),
                ),
            }),
            LOGFILES && new DailyRotateFile({
                ...dailyRotateFileOption,
                filename: '%DATE%.log',
            }),
            LOGFILES && new DailyRotateFile({
                ...dailyRotateFileOption,
                level: 'error',
                filename: '%DATE%.errors.log',
            }),
        ].filter(Boolean),
        exceptionHandlers: [
            LOGFILES && new DailyRotateFile({
                ...dailyRotateFileOption,
                level: 'error',
                filename: '%DATE%.errors.log',
            }),
        ].filter(Boolean),
        rejectionHandlers: [
            LOGFILES && new DailyRotateFile({
                ...dailyRotateFileOption,
                level: 'error',
                filename: '%DATE%.errors.log',
            }),
        ].filter(Boolean),
    })
    return winstonLogger
}

const logger = await createLogger()
const loggerMiddleware = honoLogger(logger.info)
export { loggerMiddleware }
export default logger
