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

// 👇 clau: heretar del Router.App (usa (Router as any) per compat versions)
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

  _setup() {
    (Router.startRouter as any)({
      appInstance: this,
      bootComponent: Boot,
      root: "home",
      routes: [
        { path: "home", component: HomeSection as any },
        { path: "home/detail/:id", component: Detail as any },
        { path: "player/:id", component: Player as any },
        { path: "suggest", component: SuggestSection as any },
        { path: "suggest/detail/:id", component: Detail as any },
        { path: "breathe", component: BreatheSection as any },
        { path: "breathe/detail/:id", component: Detail as any },
        { path: "longform", component: Longform as any },
        { path: "longform/detail/:id", component: Detail as any },
        { path: "search", component: SearchSection as any },
        { path: "search/detail/:id", component: Detail as any },
        { path: "watchlist", component: Template as any },
        { path: "*", redirect: "home" },
      ],
    });
  }
}
