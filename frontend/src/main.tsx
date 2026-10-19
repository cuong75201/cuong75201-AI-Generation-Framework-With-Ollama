import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'
import { createBrowserRouter, RouterProvider } from 'react-router'
import layout from './layout/layout.tsx'
import { ChatPage } from './pages/ChatPage.tsx'

 const router = createBrowserRouter([
  {
    path:"/",
    Component:layout,
    children:[
      {
        index:true,
        Component: ChatPage
      }
    ]
  }
 ])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router}>

    </RouterProvider>
  </StrictMode>,
)
