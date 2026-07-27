// ═══════════ Registre des builders de créatures toon ═══════════
// Chaque lignée vit dans son fichier ; les noms d'export sont fixes.

import { buildBraisou, buildPyrofel, buildInfernyx } from './feu.js';
import { buildGouttix, buildAquarel, buildTorrentor } from './eau.js';
import { buildFeuillo, buildSylvard, buildFlorakhan } from './plante.js';
import { buildVoltine, buildFulgurix, buildMegavolt } from './electrik.js';
import { buildRocaillou, buildGranitor, buildTitanroc } from './roche.js';
import { buildPsybulle, buildMentalys, buildOracylon } from './psy.js';
import { buildPlumze, buildAeriel, buildCyclonos } from './vent.js';
import { buildOmbrion, buildNocturnyx, buildAbyssum } from './ombre.js';

export const BUILDERS = {
  braisou: buildBraisou, pyrofel: buildPyrofel, infernyx: buildInfernyx,
  gouttix: buildGouttix, aquarel: buildAquarel, torrentor: buildTorrentor,
  feuillo: buildFeuillo, sylvard: buildSylvard, florakhan: buildFlorakhan,
  voltine: buildVoltine, fulgurix: buildFulgurix, megavolt: buildMegavolt,
  rocaillou: buildRocaillou, granitor: buildGranitor, titanroc: buildTitanroc,
  psybulle: buildPsybulle, mentalys: buildMentalys, oracylon: buildOracylon,
  plumze: buildPlumze, aeriel: buildAeriel, cyclonos: buildCyclonos,
  ombrion: buildOmbrion, nocturnyx: buildNocturnyx, abyssum: buildAbyssum,
};
