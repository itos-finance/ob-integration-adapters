import { berachainClient } from "../../config";
import { BurvePoolProvider } from "./BurvePoolProvider";

const stateProvider = new BurvePoolProvider(berachainClient);

stateProvider.start();
