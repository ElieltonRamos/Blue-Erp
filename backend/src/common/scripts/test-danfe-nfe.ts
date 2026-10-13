/* eslint-disable @typescript-eslint/no-floating-promises */
import { DanfeNfeGenerator } from '../../features/fiscal-module/lib/danfe/nfe-danfe-generator';

new DanfeNfeGenerator()
  .generateFromXml(process.argv[2], process.argv[3])
  .then(() => console.log('PDF gerado:', process.argv[3]));
