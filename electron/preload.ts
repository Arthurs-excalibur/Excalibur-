import { contextBridge, ipcRenderer } from 'electron'

const api = {
  send: (channel: string, data: any) => {
    ipcRenderer.send(channel, data)
  },
  invoke: (channel: string, data?: any) => {
    return ipcRenderer.invoke(channel, data)
  },
  on: (channel: string, func: (...args: any[]) => void) => {
    const subscription = (_event: any, ...args: any[]) => func(...args)
    ipcRenderer.on(channel, subscription)
    return () => ipcRenderer.removeListener(channel, subscription)
  }
}

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('electron', api)
} else {
  // @ts-ignore
  window.electron = api
}
