import { berachainBepoliaClient } from "../../config";
import { BurvePoolProvider } from "./BurvePoolProvider";

// NOTE: Currently setup to use the Bepolia testnet
const stateProvider = new BurvePoolProvider(berachainBepoliaClient);

stateProvider.start();
