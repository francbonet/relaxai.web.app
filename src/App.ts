// src/App.ts
import { Lightning as L, Router, Utils } from "@lightningjs/sdk";
import { Theme } from "./core/theme";
import HomeSection from "./pages/Home";
import SuggestSection from "./pages/SuggestSection";
import Template from "./pages/Template";
import Detail from "./pages/Detail";
import { Player } from "./pages/player/Player";
import Boot from "./pages/Boot";
import BreatheSection from "./pages/Breathe";
import Longform from "./pages/Longform";
import SearchSection from "./pages/Search";
import { App as CapApp } from "@capacitor/app";

export default class App extends (Router as any).App {
  static _template(): L.Component.Template<any> {
    return {
      w: Theme.w,
      h: Theme.h,
      color: Theme.colors.bg,
      Pages: {},
      Widgets: {},
    };
  }

  static getFonts() {
    return [
      {
        family: "RelaxAI-SoraBold",
        url: Utils.asset("fonts/Sora-Bold.ttf") as string,
      },
      {
        family: "RelaxAI-SoraSemiBold",
        url: Utils.asset("fonts/Sora-SemiBold.ttf") as string,
      },
      {
        family: "RelaxAI-SoraRegular",
        url: Utils.asset("fonts/Sora-Regular.ttf") as string,
      },
      {
        family: "RelaxAI-SoraMedium",
        url: Utils.asset("fonts/Sora-Medium.ttf") as string,
      },
      {
        family: "RelaxAI-SoraLight",
        url: Utils.asset("fonts/Sora-Light.ttf") as string,
      },
      {
        family: "RelaxAI-Manrope",
        url: Utils.asset("fonts/Manrope-Regular.ttf") as string,
      },
      {
        family: "RelaxAI-ManropeMed",
        url: Utils.asset("fonts/Manrope-Medium.ttf") as string,
      },
    ];
  }

  _init() {
    CapApp.addListener("backButton", () => {
      console.log("[App] backButton Listener");
      const ev = new KeyboardEvent("keydown", {
        key: "Backspace",
        keyCode: 8,
        which: 8,
      });
      window.dispatchEvent(ev);
    });
  }

  _setup() {
    (Router.startRouter as any)({
      appInstance: this,
      bootComponent: Boot,
      root: "home",
      routes: [
        {
          path: "home",
          component: HomeSection as any,
          options: { preventStorage: false },
        },
        {
          path: "home/detail/:id",
          component: Detail as any,
          options: { preventStorage: false },
        },
        {
          path: "player/:id",
          component: Player as any,
          options: { preventStorage: false },
        },
        {
          path: "suggest",
          component: SuggestSection as any,
          options: { preventStorage: false },
        },
        {
          path: "suggest/detail/:id",
          component: Detail as any,
          options: { preventStorage: false },
        },
        {
          path: "breathe",
          component: BreatheSection as any,
          options: { preventStorage: false },
        },
        {
          path: "breathe/detail/:id",
          component: Detail as any,
          options: { preventStorage: false },
        },
        {
          path: "longform",
          component: Longform as any,
          options: { preventStorage: false },
        },
        {
          path: "longform/detail/:id",
          component: Detail as any,
          options: { preventStorage: false },
        },
        {
          path: "search",
          component: SearchSection as any,
          options: { preventStorage: false },
        },
        {
          path: "search/detail/:id",
          component: Detail as any,
          options: { preventStorage: false },
        },
        {
          path: "watchlist",
          component: Template as any,
          options: { preventStorage: false },
        },
        { path: "*", redirect: "home" },
      ],
    });
  }
}
