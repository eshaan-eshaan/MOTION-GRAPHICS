import "./theme";
import { Composition, Folder } from "remotion";
import { OpeningScene } from "./scenes/OpeningScene";
import { ObservationScene } from "./scenes/ObservationScene";
import { AryabhataScene } from "./scenes/AryabhataScene";
import { JantarMantarScene } from "./scenes/JantarMantarScene";
import { ChandrayaanScene } from "./scenes/ChandrayaanScene";
import { ClosingScene } from "./scenes/ClosingScene";
import { IndianAstronomy } from "./IndianAstronomy";
import { FPS, HEIGHT, SCENES, TOTAL_FRAMES, WIDTH } from "./timeline";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="IndianAstronomy"
        component={IndianAstronomy}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Folder name="Scenes">
        <Composition
          id="OpeningScene"
          component={OpeningScene}
          durationInFrames={SCENES.opening.durationInFrames}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="ObservationScene"
          component={ObservationScene}
          durationInFrames={SCENES.observation.durationInFrames}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="AryabhataScene"
          component={AryabhataScene}
          durationInFrames={SCENES.aryabhata.durationInFrames}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="JantarMantarScene"
          component={JantarMantarScene}
          durationInFrames={SCENES.jantarMantar.durationInFrames}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="ChandrayaanScene"
          component={ChandrayaanScene}
          durationInFrames={SCENES.chandrayaan.durationInFrames}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="ClosingScene"
          component={ClosingScene}
          durationInFrames={SCENES.closing.durationInFrames}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
      </Folder>
    </>
  );
};
