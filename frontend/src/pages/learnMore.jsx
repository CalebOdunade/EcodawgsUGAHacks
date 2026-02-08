import "./learnMore.css";
import { useNavigate } from "react-router-dom";

const ICON_GOOD =
  "https://res.cloudinary.com/dvucimldu/image/upload/v1770550269/b8c6e8130e5374f4e5fdc903feaad917814bd58caef6a8d9a2c48f20b983bc33-removebg-preview_evisq8.png";

const ICON_BAD =
  "https://res.cloudinary.com/dvucimldu/image/upload/v1770550734/4067535-removebg-preview_i2aitt.png";

const ICON_TRICKY =
  "https://res.cloudinary.com/dvucimldu/image/upload/v1770550758/images-removebg-preview_w7jgff.png";

const ICON_UGA =
  "https://res.cloudinary.com/dvucimldu/image/upload/v1770546989/e9af703f-ab9d-4702-adfc-4ef44837e5ba-removebg-preview_vlbbpj.png";

const STORYMAP_URL =
  "https://storymaps.arcgis.com/stories/a41202253eff47e789c94ce631fa82e0";

export default function LearnMorePage() {
  const navigate = useNavigate();

  return (
    <div className="lpage">
      <div className="lphone">
        <div className="lscene">
          {/* Header */}
          <div className="lheader">
            <button className="lbtn" type="button" onClick={() => navigate("/")}>
              ← Home
            </button>

            <div className="lheaderTitle">
              <div className="lheaderTitleTop">Learn More</div>
              <div className="lheaderTitleSub">Composting at UGA</div>
            </div>

            <button className="lbtnGhost" type="button" onClick={() => navigate("/game")}>
              🎮 Game
            </button>
          </div>

          {/* Content */}
          <div className="lcontent">
            {/* Hero */}
            <div className="lhero">
              <div className="lheroLeft">
                <div className="lheroTitle">Compost smarter </div>
                <div className="lheroText">
                  Quick rules that help, plus where to check when you are not sure.
                </div>
              </div>

              <div className="lheroBadge">
                <div className="lheroBadgeTop">Rule of thumb</div>
                <div className="lheroBadgeBig">When in doubt, keep it out.</div>
              </div>
            </div>

            {/* Yes / No cards */}
            <div className="lstack">
              <div className="lcard lcardYes">
                <div className="lcardHead">
                  <div className="lcardIconWrap">
                    <img className="lcardIcon lcardIconBig" src={ICON_GOOD} alt="" />
                  </div>
                  <div className="lcardHeadText">
                    <div className="lcardTitle">Good compost items</div>
                    <div className="lcardSub">Common wins you will see most often</div>
                  </div>
                </div>

                <div className="lchips">
                  <div className="lchip">Fruit and veggie scraps</div>
                  <div className="lchip">Coffee grounds and paper filters</div>
                  <div className="lchip">Eggshells</div>
                  <div className="lchip">Leaves and yard waste, if accepted</div>
                  <div className="lchip">Uncoated paper napkins</div>
                </div>

                <div className="lminiNote">
                  Tip: remove produce stickers whenever possible.
                </div>
              </div>

              <div className="lcard lcardNo">
                <div className="lcardHead">
                  <div className="lcardIconWrap">
                    <img className="lcardIcon lcardIconWarn" src={ICON_BAD} alt="" />
                  </div>
                  <div className="lcardHeadText">
                    <div className="lcardTitle">Keep these out</div>
                    <div className="lcardSub">They contaminate compost or break equipment</div>
                  </div>
                </div>

                <div className="lchips">
                  <div className="lchip lchipBad">Plastic and wrappers</div>
                  <div className="lchip lchipBad">Styrofoam</div>
                  <div className="lchip lchipBad">Batteries and e-waste</div>
                  <div className="lchip lchipBad">Glass and metal</div>
                  <div className="lchip lchipBad">Liquids</div>
                </div>

                <div className="lminiNote">
                  Note: “biodegradable” does not always mean compostable. Many “compostable plastics” require industrial composting.
                </div>
              </div>

              {/* Tricky items */}
              <div className="lcard lcardSoft">
                <div className="lcardHead">
                  <div className="lcardIconWrap">
                    <img className="lcardIcon lcardIconWarn" src={ICON_TRICKY} alt="" />
                  </div>
                  <div className="lcardHeadText">
                    <div className="lcardTitle">Tricky items</div>
                    <div className="lcardSub">These cause the most mistakes</div>
                  </div>
                </div>

                <div className="ltricky">
                  <div className="ltrickyRow">
                    <div className="ltrickyName">To-go coffee cups</div>
                    <div className="ltrickyWhy">Often plastic lined.</div>
                  </div>

                  <div className="ltrickyRow">
                    <div className="ltrickyName">“Compostable” forks and cups</div>
                    <div className="ltrickyWhy">May require industrial composting.</div>
                  </div>

                  <div className="ltrickyRow">
                    <div className="ltrickyName">Greasy pizza boxes</div>
                    <div className="ltrickyWhy">Rules vary, grease can be a problem.</div>
                  </div>

                  <div className="ltrickyRow">
                    <div className="ltrickyName">Tea bags</div>
                    <div className="ltrickyWhy">Some contain plastic fibers, look for plastic free.</div>
                  </div>
                </div>
              </div>

              {/* UGA compost team */}
              <div className="lcard lcardUGA">
                <div className="lcardHead">
                  <div className="lcardIconWrap">
                    <img className="lcardIcon lcardIconUGA" src={ICON_UGA} alt="" />
                  </div>
                  <div className="lcardHeadText">
                    <div className="lcardTitle">UGA Compost Team</div>
                    <div className="lcardSub">Keeping campus composting cleaner and easier to use</div>
                  </div>
                </div>

                <p className="lpara">
                  If you are on campus and not sure what goes where, the UGA Compost Team has guidance,
                  bin locations, and visuals that make it easier.
                </p>

                <a className="llinkBtn" href={STORYMAP_URL} target="_blank" rel="noreferrer">
                  Open the UGA Compost guide →
                </a>

                <div className="llinkSmall">
                  If the button does not work, copy this link:
                  <div className="llinkCode">
                    <code>{STORYMAP_URL}</code>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="lactions">
              <button className="lbtnPrimary" type="button" onClick={() => navigate("/game")}>
                Play the Game
              </button>
              <button className="lbtn" type="button" onClick={() => navigate("/")}>
                Back to Home
              </button>
            </div>

            <div style={{ height: 8 }} />
          </div>

          {/* Footer */}
          <div className="lfooter">
            <div className="lhelp">Help</div>
            <div className="lbrand">EcoDawgs</div>
          </div>
        </div>
      </div>
    </div>
  );
}
