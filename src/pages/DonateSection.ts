import { BasePage } from "./base/BasePage";
import Header from "../molecules/Header";
import { getActiveRouteName } from "../utils/routerUtils";
import { HtmlParagraphImage } from "../atoms/HtmlParagraphImage";

const HEADER_H = 200;

const DONATION_URI =
  "web+cardano:addr1q8rvamkvuew7x5ge6zzwngs4k5tcu6eglfjx7tl0d4zsz9zhrpmrytlfvujda02q5aq00c5q7gpdej04wyaap5kw7neq7gwmym?amount=10000000&message=Donation%20to%20the%20RelaxAI%20platform";

export default class DonateSection extends BasePage {
  protected override get hasHeader() {
    return true;
  }

  protected override get sections() {
    return [];
  }

  protected override get enableScrollSnap() {
    return false;
  }

  protected override get defaultHeights() {
    return {
      Header: HEADER_H,
    };
  }

  static override _template() {
    return BasePage.chrome({
      Header: {
        type: Header,
        h: HEADER_H,
        signals: { navigate: true, focusNext: true },
      },
      Donate: {
        x: 40,
        y: HEADER_H + 40,
        type: HtmlParagraphImage,
        w: 1920,
        visible: true,
      },
    });
  }

  override _focus() {
    const name = getActiveRouteName();
    this.tag("Viewport.Content.ContentInner.Header")?.setCurrentByRoute?.(name);
  }

  override _getFocused() {
    return this.tag("Viewport.Content.ContentInner.Header");
  }

  public override focusNext() {
    const cur = (this as any)._section ?? -1;
    const max = 0;
    (this as any)._section = Math.min(max, cur + 1);
    this._applyScrollForSection?.((this as any)._section);
    this._syncHistorySnapshot();
    this._refocus();
  }

  override focusPrev() {
    const min = this.hasHeader ? -1 : 0;
    (this as any)._section = Math.max((this as any)._section - 1, min);
    this._applyScrollForSection?.((this as any)._section);
    this._syncHistorySnapshot();
    this._refocus();
  }

  override async _active() {
    super._active();

    const inner = "Viewport.Content.ContentInner";
    const donate = this.tag(`${inner}.Donate`) as any;

    if (donate) {
      await donate.setContent?.({
        html: `
          <div style="
            padding:48px;
            background:linear-gradient(145deg, #001219, #005f73);
            border-radius:24px;
          ">

            <div style="
              display:flex;
              flex-direction:row;
              gap:32px;
              align-items:flex-start;
              justify-content:space-between;
            ">
              <!-- Columna text -->
              <div style="flex:2; min-width:0;">
                <p style="
                  font-family:'RelaxAI-SoraBold';
                  font-size:48px;
                  margin-bottom:24px;
                  color:#ffffff;
                ">
                  Support RelaxAI with a Cardano donation 💙
                </p>

                <p style="
                  font-family:'RelaxAI-SoraRegular';
                  font-size:30px;
                  margin-bottom:24px;
                  color:#e5e5e5;
                  line-height:1.6;
                ">
                  RelaxAI is an experimental slow-TV and ambient platform built with love,
                  open tools and independent infrastructure. Your donation helps us cover
                  server costs, video encoding, storage and the creation of new relaxing channels.
                </p>

                <ul style="list-style:none; padding:0; margin:0;">

                  <li style="
                    display:flex;
                    align-items:flex-start;
                    margin-bottom:18px;
                    font-family:'RelaxAI-SoraRegular';
                    font-size:28px;
                    color:#e5e5e5;
                  ">
                    <span style="
                      display:inline-block;
                      margin-right:16px;
                      color:#00d4ff;
                      font-size:34px;
                    ">✔</span>
                    Help keep RelaxAI online and ad-free
                  </li>

                  <li style="
                    display:flex;
                    align-items:flex-start;
                    margin-bottom:18px;
                    font-family:'RelaxAI-SoraRegular';
                    font-size:28px;
                    color:#e5e5e5;
                  ">
                    <span style="
                      display:inline-block;
                      margin-right:16px;
                      color:#00d4ff;
                      font-size:34px;
                    ">✔</span>
                    Support new relaxing streams and content experiments
                  </li>

                  <li style="
                    display:flex;
                    align-items:flex-start;
                    margin-bottom:18px;
                    font-family:'RelaxAI-SoraRegular';
                    font-size:28px;
                    color:#e5e5e5;
                  ">
                    <span style="
                      display:inline-block;
                      margin-right:16px;
                      color:#00d4ff;
                      font-size:34px;
                    ">✔</span>
                    Back an indie project built on Cardano
                  </li>
                </ul>
              </div>

              <!-- Columna QR -->
              <div style="
                flex:1;
                display:flex;
                flex-direction:column;
                align-items:center;
                justify-content:flex-start;
              ">
                <div style="
                  width:360px;
                  height:360px;
                  padding:12px;
                  border-radius:24px;
                  background:rgba(0, 0, 0, 0.35);
                  border:1px solid rgba(0, 212, 255, 0.4);
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  box-sizing:border-box;
                ">
                  <img
                    src="static/wallet/qr.png"
                    alt="RelaxAI Cardano donation QR"
                    style="
                      display:block;
                      width:100%;
                      height:100%;
                      object-fit:contain;
                      border-radius:20px;
                    "
                  />
                </div>

                <p style="
                  font-family:'RelaxAI-SoraRegular';
                  font-size:22px;
                  margin-top:16px;
                  color:#e5e5e5;
                  text-align:center;
                  max-width:380px;
                  line-height:1.4;
                ">
                  Suggested donation: <span style="color:#00d4ff;">10 ADA</span><br/>
                  Thank you for supporting RelaxAI.
                </p>
              </div>
            </div>
          </div>
        `,
        width: 1840,
        fontFamily: "RelaxAI-SoraMedium",
        style: {
          fontSize: "40px",
          lineHeight: "1.6",
          letterSpacing: "0.02em",
          color: "#FFFFFF",
          textAlign: "left",
        },
      });
    }

    this.computeAfterLayout();
  }

  // Quan el botó dispari el senyal "press"
  donatePressed() {
    // Només funcionarà en entorns on hi hagi window (WebView / browser)
    try {
      if (typeof window !== "undefined") {
        window.location.href = DONATION_URI;
      } else {
        // En entorns sense window (p.ex. STB pur), com a mínim log.
        // Es podria integrar amb un deep-linking nadiu si tens bridge.
        // eslint-disable-next-line no-console
        console.log(
          "[DonateSection] Cannot open donation URI: window is undefined",
        );
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log("[DonateSection] Error opening donation URI", e);
    }
  }
}
