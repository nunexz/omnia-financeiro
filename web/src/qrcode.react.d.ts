declare module 'qrcode.react' {
  import { ComponentType } from 'react'

  interface QRCodeProps {
    value: string
    size?: number
    level?: 'L' | 'M' | 'Q' | 'H'
    includeMargin?: boolean
    renderAs?: 'canvas' | 'svg'
    [key: string]: any
  }

  const QRCode: ComponentType<QRCodeProps>
  export default QRCode
}
