import { handle } from '@hono/node-server/vercel'
import app from './app'
import logger from './middlewares/logger'

export const runtime = 'nodejs'

export const config = {
    api: {
        bodyParser: false, // 必须禁用，否则 post 请求中的 body 无法解析
    },
}

logger.info('cookie-cloudflare 云函数启动成功')

export default handle(app)
