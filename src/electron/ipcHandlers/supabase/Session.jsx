import { ipcMain } from "electron"
import { supabase } from "@services/supabase/Client"

function Session() {
  ipcMain.handle("set-supabase-session", async (event, authSession) => {
    await supabase.auth.setSession({
      access_token: authSession.access_token,
      refresh_token: authSession.refresh_token,
    })
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        console.log("Session restaurée :", session.user.email)
      } else {
        console.log("Aucune session Supabase")
      }
  })
}

export { Session }
