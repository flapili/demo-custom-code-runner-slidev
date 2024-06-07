import type { CodeRunnerStream } from '@slidev/types'
import { defineCodeRunnersSetup } from '@slidev/types'

export default defineCodeRunnersSetup(() => {
  return {
    async python(code, { options }) {
      console.log('Running Python code:', code, options)
      // Python code runner using WS and piston

      // const pipPackages = options?.pipPackages as String[] || []
      // temporary work around for the issue about regex parsing conflit with js object

      const pipPackages = options as unknown as String[] || []
      const cmd = [] as String[]
      if (pipPackages.length) {
        cmd.push('pip', 'install', ...pipPackages, '&&')
      }
      cmd.push('python', '-u', 'main.py')

      const stream = new ReadableStream<CodeRunnerStream>({
        start(controller) {
          const ws = new WebSocket('ws://localhost:2000/ws')
          ws.onopen = () => {
            ws.send(JSON.stringify({
              image: 'python:3.12-slim',
              files: [
                {
                  name: 'main.py',
                  content: code,
                },
              ],
              cmd: ['bash', '-c', cmd.join(' ')],
            }))
          }

          ws.onmessage = ({ data }) => {
            const payload = JSON.parse(data)
            if (payload.type === 'data') {
              controller.enqueue({
                type: payload.stream,
                data: payload.text,
              })
            }
            else if (payload.type === 'exit') {
              controller.enqueue({
                type: 'exit',
                code: payload.code,
              })
            }
          }

          ws.onerror = (e) => {
            console.error(e)
          }

          ws.onclose = (e) => {
            if (e.code !== 4999) // 4999 mean job is completed in piston
              console.error(e.code, e.reason)
            controller.close()
          }
        },
      })

      return stream
    },

  }
})
