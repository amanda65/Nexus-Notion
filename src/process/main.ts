import { Process, DataResponse } from "@nexus-app/nexus-module-builder";
import { session, shell, WebContentsView } from "electron";
import path from "path";

// These is replaced to the ID specified in export-config.js during export. DO NOT MODIFY.
const MODULE_ID: string = "{EXPORTED_MODULE_ID}";
const MODULE_NAME: string = "{EXPORTED_MODULE_NAME}";
// ---------------------------------------------------

// If you have an icon, specify the relative path from this file.
// Can be a .png, .jpeg, .jpg, or .svg

const ICON_PATH: string = path.join(__dirname, "./notion_logo.png")


export default class SampleProcess extends Process {
  private partition: string = `persist:${MODULE_ID}`;

  // This user agent should work on most websites.
  private userAgent: string = session
    .fromPartition(this.partition)
    .getUserAgent()
    .replace(/Electron\/*/, "");

  /**
   *  The constructor. Should not directly be called,
   *      and should not contain logic relevant to the renderer.
   */
  public constructor() {
    super({
      moduleID: MODULE_ID,
      moduleName: MODULE_NAME,
      paths: {
        iconPath: ICON_PATH,
        htmlPath: path.join(__dirname, "../renderer/index.html"),
      },
    });
  }

  private checkAuthorized = async (): Promise<boolean> => {
    const cookies = session.fromPartition(this.partition).cookies;

    // Get a specific Cookie
    const cookie: Electron.Cookie[] = await cookies.get({
      url: "https://www.notion.so/",
      name: "token_v2",
    });

    return cookie.length > 0;
  };

  public async initialize(): Promise<void> {
    const response: DataResponse = await this.requestExternal(
      "nexus.Main",
      "get-module-window"
    );
    const view: WebContentsView = response.body;

    let isAuthorized: boolean = false;
    setInterval(async () => {
      isAuthorized = await this.checkAuthorized();
    }, 1000);

    view.webContents.setWindowOpenHandler((details) => {
      if (isAuthorized) {
        shell.openExternal(details.url);
      }
      return isAuthorized ? { action: "deny" } : { action: "allow" };
    });

    view.webContents.on("did-attach-webview", (_, contents) => {
      contents.setWindowOpenHandler((details) => {
        if (isAuthorized) {
          shell.openExternal(details.url);
        }
        return isAuthorized ? { action: "deny" } : { action: "allow" };
      });
    });


    this.sendToRenderer("user-agent", {
      userAgent: this.userAgent,
      partition: this.partition,
    });
  }

  public async handleEvent(eventType: string, data: any[]): Promise<any> {
    switch (eventType) {
      case "init": {
        // This event is sent from the ../renderer/renderer.ts when the frontend is ready.
        this.initialize();
        break;
      }
      default: {
        console.warn(
          `[${MODULE_NAME}] Uncaught message: ${eventType} | ${data}`
        );
        break;
      }
    }
  }
}
