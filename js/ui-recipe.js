// "How a picture is made" (v4): the one place where every rule is stated. Seventeen steps in the order the code runs them, each with the
// same six parts. With a planet chosen, each step also shows that planet's own inputs and outputs, from traceOf (ui-trace.js), which reads
// the values the drawing code used. The constants written here are the ones in the code: physics-worlds-auto.js (steps 4–7),
// physics-derived.js (3, 8, 10), physics-giants.js (9), ui-state.js and render-terrain.js (11), scene-recipe.js (12, 15, 16).
const S_ = l => srcTag(l);
const RSTEPS = [
  { n: 1, plain: "Every picture starts from a handful of numbers about the star and the planet. Almost all come from one public catalogue. Where a number is missing, the guide fills it in by a stated rule and says so.",
    goes: [`The NASA Exoplanet Archive's table of one best value per planet, as downloaded on ${typeof CAT_DATE !== "undefined" ? CAT_DATE : "the date shown on the home page"} ${S_(0)}`, `Where the papers about a planet give better values than the catalogue's, the papers' values are used, and the planet's technical table says so ${S_(0)}`],
    rule: `<p>Used from the catalogue: the star's temperature, radius, mass and age; the planet's orbit size, year, orbit shape (eccentricity), radius, mass, and whether that mass is only a minimum; the distance; and how and when the planet was found.</p>
      <p><b>Filling gaps.</b> Orbit size from the year, or the year from the orbit size, by Kepler's law: <code>a³ = M★ P²</code> (AU, solar masses, years). A missing star mass: <code>R★^1.25</code> (at most 2), or <code>(T★/5772)^1.8</code> (at most 2.5), or 1. A missing star radius: <code>M★^0.9</code> below one solar mass, <code>M★^0.8</code> above, and 0.1 for brown dwarfs. A missing star temperature: <code>5772 × M★^0.55</code> K, kept between 2,600 and 10,000 K. A missing age: 5 billion years.</p>
      <p><b>Size from mass, or mass from size</b> (Chen & Kipping 2017), in Earth units: <code>R = 1.008 M^0.279</code> below 2.04 Earth masses, <code>R = 0.808 M^0.589</code> up to 132, <code>R = 17.74 M^−0.044</code> above; and the reverse, <code>M = (R/1.008)^3.58</code> below 1.23 Earth radii and <code>M = (R/0.808)^1.70</code> above. With neither, the radius is taken as 1.</p>
      <p><b>Masses that are not used.</b> A mass the catalogue marks as an upper limit is treated as unknown. So is a mass that gives an impossible density: above 18 g/cm³ (unless the planet is over 1,300 Earth masses and over 6 Earth radii, where such densities are real), above 12 g/cm³ for a planet of 2 Earth radii or more, or below 0.01 g/cm³.</p>
      <p><b>Left out:</b> 8 planets of pulsars (no starlight to draw by) and 7 with no known orbit.</p>`,
    out: "The star's temperature, radius and mass; the planet's orbit, radius and mass; the system's age. Each is marked measured or calculated in the planet's technical table.",
    obs: () => `Six catalogue values are replaced by hand, each with its source: ${typeof DATA_FIX !== "undefined" ? Object.entries(DATA_FIX).map(([n, f]) => `${n} (${f.what}: ${f.src.replace(/:.*$/, "")})`).join("; ") : ""}. For four of them the catalogue's radius is that of a dust tail, not of the planet.`,
    src: "NASA Exoplanet Archive; Chen & Kipping 2017. An estimated mass or radius can be wrong by a factor of two, and everything downstream inherits that." },
  { n: 2, plain: "The star's colour comes from its temperature. How big it looks, and how bright its light is at the planet, come from its size and the planet's distance.",
    goes: [`Star temperature and radius ${S_(0)}`, `Orbit size ${S_(0)}`],
    rule: `<p><b>Spectrum:</b> model atmospheres of real stars (PHOENIX; Husser et al. 2013), 16 models from 2,400 to 10,000 K, at 21 wavelengths from 380 to 780 nm, interpolated in temperature. Hotter stars shade toward a perfect radiator.</p>
      <p><b>Size in the sky:</b> <code>2 asin(R★ / a)</code>. <b>Total light at the planet,</b> against Earth's: <code>R★² (T★/5772)⁴ / a²</code> (solar radii, AU). <b>Visible light:</b> the same spectrum weighed by the eye's sensitivity (CIE 1931).</p>
      <p><b>Colour as seen:</b> the eye adjusts to the colour of the light it lives in, but not fully. The guide adjusts completely for stars of 5,000 K and hotter, and less and less for cooler ones, down to 60% at 2,500 K, so a red dwarf's light stays amber as candlelight stays warm (after Zhai & Luo 2018).</p>
      <p><b>Two stars:</b> for 11 planets that circle a pair of stars whose second star has been measured, that star is drawn as measured. For the rest, a small red companion is assumed and marked so.</p>`,
    out: "The star's disc, its colour, and the colour and strength of daylight.",
    obs: () => "Nothing replaces this step: its inputs are already measurements.",
    src: "Husser et al. 2013; Zhai & Luo 2018. One chemical make-up per temperature; no starspots or flares. White dwarfs and brown dwarfs are drawn with an ordinary star's spectrum of the same temperature, which is only roughly right." },
  { n: 3, plain: "Starlight warms a planet until it sheds as much heat as it takes in. That balance gives a first temperature. Young giant planets also glow with heat left from their birth.",
    goes: [`Star temperature and radius, orbit size ${S_(0)}`, `For giants: mass and age ${S_(0)} or ${S_(1)}`],
    rule: `<p><b>From starlight:</b> <code>T = T★ √(R★ / 2a)</code>, for a planet that reflects nothing and spreads heat evenly over its whole surface.</p>
      <p><b>A giant's own heat</b> (planets over 60 Earth masses): <code>T = 447 K × (M / M_Jupiter)^0.5 × (age / 20 million years)^−0.32</code>, a fit to young giants that have been photographed. The two add as energy: <code>(T_star⁴ + T_own⁴)^¼</code>.</p>`,
    out: "A temperature used to choose the planet's type and its clouds. It is not yet the temperature where you stand (steps 8 to 10).",
    obs: () => `A measured glow replaces the fit for the giant's own heat on ${countMeas("Tint")} planets.`,
    src: "The share of light a planet reflects is unknown for almost all of them, which moves this temperature by 5 to 10%. The fit gives Jupiter 80 K where its own heat is about 100 K." },
  { n: 4, plain: "Size comes first: big planets are gas, small ones rock. Between about 1.5 and 2 Earth radii lies a gap with few planets, the radius valley, which divides the two. Where a mass is measured, density is a second check.",
    goes: [`Radius ${S_(0)} or ${S_(1)}`, `Mass, where measured ${S_(0)}`, `Year, star mass ${S_(0)}`, `Temperature from step 3 ${S_(1)}`],
    rule: `<p><b>By size:</b> 6 Earth radii and more is a giant; 4 to 6 is Neptune-like. Below 4, the radius valley decides: <code>R_valley = 10^(0.37 − 0.09 log P) × M★^0.26</code> Earth radii, with the year P held between 1 and 100 days and the star mass not taken below 0.5. A planet under 0.9 × R_valley is rocky; over 1.1 × R_valley it is a sub-Neptune (a small planet wrapped in gas); in between, inside the valley itself, it could be either, so worlds of both kinds are offered. The guide calls these <i>valley planets</i>. Inside the habitable zone the valley band reaches up to 1.9 Earth radii.</p>
      <p><b>By density,</b> where the mass is measured: the radius is compared with <code>M^0.27</code>, the size of an Earth-like ball of rock and iron. Under 92% of that: iron-rich. Up to 108%: rock and iron. A planet of 1.3 to 2.2 Earth radii that is 18% or more larger than rock allows, and warmer than 250 K, must hold water or gas, and such a world is put first.</p>
      <p><b>Named types</b> by temperature: giants cold (below 300 K), warm (to 950 K), hot (to 2,000 K) and ultra-hot; Neptune-like planets cold (below 300 K), warm (to 900 K), hot; sub-Neptunes cold (below 250 K), temperate (to 400 K), warm (to 1,000 K), hot. A rocky planet takes its type from its first world in step 7.</p>
      <p><b>How sure:</b> the planet is rebuilt 300 times with its radius changed at random by 5% (15% if the radius came from the mass), its mass by 15%, the star's temperature by 2%, the valley by 8% and the temperature by 4%, and classified each time. The shares are the odds shown.</p>`,
    out: "The planet's type, how sure it is, and which family of worlds step 7 draws from.",
    obs: () => "Four planets that are shedding dust tails are classed as small rocky bodies whatever their catalogue radius.",
    src: "Fulton et al. 2017; Van Eylen et al. 2018; Van Eylen et al. 2021; Petigura et al. 2022; Cloutier & Menou 2020; Chen & Kipping 2017. The valley's place and slope differ between studies, most of all round small stars; the errors used are typical ones, not each planet's own." },
  { n: 5, plain: "A planet close to its star is slowed by tides until one side faces the star for ever, as the Moon faces Earth. The guide works out how long that would take and compares it with the system's age.",
    goes: [`Mass, radius, orbit size, star mass, age, orbit shape ${S_(0)} or ${S_(1)}`],
    rule: `<p><b>Time to stop spinning:</b> <code>t = ω a⁶ α m Q / (3 G M★² k₂ R³)</code>, starting from a 12-hour day for rocky planets and a 10-hour day for planets over 4 Earth radii. Rocky: Q = 100, k₂ = 0.3, α = 0.33. Gas: Q = 100,000, k₂ = 0.5, α = 0.25.</p>
      <p><b>One face to the star</b> if that time is under 30% of the system's age and the orbit is close to round (eccentricity 0.1 or less). The margin is there because the estimate is uncertain by orders of magnitude.</p>
      <p><b>Places to stand.</b> On a planet with one face to the star: under the star (6° from that point), the day side (50°), the line between day and night (88°) and the night side (150°). On any other planet the four places are noon, afternoon, sunset and night, and the time of day is a choice.</p>`,
    out: "Whether the star hangs still in the sky, and where it stands at each place.",
    obs: () => `A measured spin replaces the rule on ${countMeas("rotH")} giant planets.`,
    src: "Gladman et al. 1996. Thick air can keep a planet turning (as on Venus), and stretched orbits can trap a planet in a faster spin; neither is modelled, so read “one face to the star” as “probably”." },
  { n: 6, plain: "A small planet keeps its air only if its gravity is strong for the starlight it gets. The dividing line is called the cosmic shoreline. A second test finds the habitable zone: the distances where water could be liquid.",
    goes: [`Mass and radius ${S_(0)} or ${S_(1)}`, `Starlight from step 2 ${S_(1)}`, `Star temperature ${S_(0)}`],
    rule: `<p><b>Hold on air:</b> <code>(M / R)² / (S × u)</code>, with M and R in Earth units and S the starlight against Earth's. u counts the extra ultraviolet of cool stars: 1 for stars of 4,500 K and hotter, rising evenly to 4 at 3,500 K and cooler. On this scale Earth is 1, Venus 0.4, Titan 0.3, Mars 0.1 and Mercury 0.003. Below 0.01 a planet is taken to be airless; from 0.01 to 0.2 thin air is the likelier outcome; above 0.2 it can hold thick air.</p>
      <p><b>Habitable zone</b> (Kopparapu et al. 2013): the cautious limits are where oceans would boil away (inner) and where no carbon-dioxide greenhouse could keep them liquid (outer). The wider, optimistic limits are set by Venus and Mars in their youth. Each is a formula in the star's temperature (held between 2,600 and 7,200 K) and brightness.</p>
      <p><b>Lava worlds are an exception:</b> molten rock can release gas faster than starlight strips it, so every lava world is offered a world with air as well as one without.</p>`,
    out: "Whether worlds with air are offered in step 7, and which.",
    obs: () => "An observation of air, or of its absence, replaces this test: see step 7.",
    src: "Zahnle & Catling 2017; Kopparapu et al. 2013. The factor of 4 for red dwarfs is a guess that JWST is testing." },
  { n: 7, plain: "From its type, its temperature and its hold on air, the guide lists every kind of world the planet could be, likeliest first. Where a telescope has looked, what it saw decides the list and its order.",
    goes: [`Type (step 4), temperature (step 3), hold on air and habitable zone (step 6), one face to the star (step 5) ${S_(1)}`, `Observations of this planet, if any ${S_(0)}`],
    rule: `<div class="tablewrap"><table class="rtab"><thead><tr><th>World</th><th>Offered when</th></tr></thead><tbody>
      <tr><td>Giant, seen from above its clouds</td><td>Every giant.</td></tr>
      <tr><td>The same giant with bright clouds, or with a dark clear sky</td><td>Giants between 350 and 2,000 K whose brightness nobody has measured: bright if the rule gives a dark planet (below 1,400 K), dark if it gives clouds.</td></tr>
      <tr><td>Small gas planet under haze</td><td>Every sub-Neptune and every valley planet.</td></tr>
      <tr><td>Water-rich world: ice shell</td><td>Sub-Neptunes and valley planets beyond the optimistic outer limit and colder than 200 K.</td></tr>
      <tr><td>Water-rich world: open ocean</td><td>Sub-Neptunes and valley planets not that cold, cooler than 420 K, and no closer to the star than 95% of the cautious inner limit. Above 2 Earth radii the text says a liquid surface is disputed.</td></tr>
      <tr><td>Water-rich world: steam</td><td>Sub-Neptunes and valley planets too warm for an open ocean but cooler than 900 K.</td></tr>
      <tr><td>Sea of lava, with and without air</td><td>Rocky and valley planets where bare ground under the star would pass 1,650 K and stay molten at least 30° away from that point.</td></tr>
      <tr><td>Scorched bare rock</td><td>Rocky and valley planets that are not molten but are closer than 92% of the cautious inner limit.</td></tr>
      <tr><td>Hot world under acid clouds, like Venus</td><td>The same planets, if their hold on air is 0.01 or more (shown first if it is above 0.2), and planets just inside the habitable zone, within 10% of its inner limit.</td></tr>
      <tr><td>Temperate world with seas</td><td>In the habitable zone (optimistic limits) with hold on air 0.01 or more. With one face to the star, an ocean facing the star, ringed by ice; on a spinning planet, seas and continents.</td></tr>
      <tr><td>Dry world with lakes on the line between day and night</td><td>One face to the star, too close for oceans but beyond half the inner limit, hold on air 0.05 or more.</td></tr>
      <tr><td>Frozen over; cold desert under thin air</td><td>Alongside every temperate world.</td></tr>
      <tr><td>Airless rock</td><td>In the habitable zone: the only world if hold on air is under 0.01; always offered round red dwarfs (below 3,900 K).</td></tr>
      <tr><td>Frozen world; frozen world under orange haze</td><td>Beyond the habitable zone; the hazy one first if hold on air is above 0.2 and it is colder than 160 K.</td></tr></tbody></table></div>
      <p><b>Order.</b> The list above is the order of likelihood the rules give. Three things change it: a low measured density puts the water or gas world first; a hold on air between 0.01 and 0.2 puts the thin-air desert first; and a valley planet in the lower half of the valley puts the rocky worlds first.</p>`,
    out: "The worlds shown for the planet and their order, and for each world its air (gas and pressure), its ground, and where you stand.",
    obs: () => `Observations set or reorder the worlds of ${countObs()} planets: the world a telescope saw or points to is put first, with the paper cited, and a paper's own reading can be added as a world. Where papers describe a planet's possible worlds in detail, those worlds are written from the papers, not from the table above, and the planet's page cites them. How much is written about a planet depends on how much has been published about it.`,
    src: "Zahnle & Catling 2017; Kopparapu et al. 2013; Yang et al. 2013; Turbet et al. 2020; Leconte et al. 2013; Innes et al. 2023. These are rules of thumb: for a planet nobody has observed, they say which worlds are possible, not which one is real." },
  { n: 8, plain: "For a rocky world with air, the guide balances the starlight coming in against the heat going out to find the temperature at each place, and with it where water is liquid or frozen.",
    goes: [`Starlight (step 2) ${S_(1)}`, `This world's gas and pressure ${S_(2)}, or ${S_(0)} where observed`, `One face to the star or not (step 5) ${S_(1)}`],
    rule: `<p><b>Balance at a place:</b> <code>T⁴ = g × [(1 − ε)(1 − A) S x + ε (1 − A) S / 4] / σ</code>. A, the share of light reflected, is 0.30, falling to 0.22 under the reddest stars. g, the greenhouse, is <code>1 + 0.75 τ</code> with τ = 0.8 per bar of nitrogen and 1.2 per bar of air rich in carbon dioxide. ε, the share of heat that winds even out, is <code>P / (P + 1)</code>, at most 0.9. x is the cosine of the angle from the point under the star (one face to the star), or the cosine of the latitude divided by π (spinning).</p>
      <p><b>Water and ice:</b> the sea is open where T is above 273 K. That gives the width of an ocean facing the star, or the latitude where ice caps start.</p>
      <p><b>How much air:</b> for worlds the rules propose, the thinnest of 1, 2, 3, 5 or 8 bar that keeps the warmest place above 283 K. Past 8 bar more carbon dioxide stops helping.</p>
      <p><b>Where you stand:</b> three quarters of the way from the point under the star to the ocean's edge (between 12° and 68°), moved toward the star until the temperature is above 278 K.</p>
      <p><b>Cloud:</b> over an ocean facing the star, cloud is thickest under the star and thins toward the ocean's edge, up to 85% cover (Yang et al. 2013).</p>`,
    out: "The temperature where you stand, the reach of open water and ice, and the cloud cover.",
    obs: () => "Hand-written worlds state their own temperature where a paper gives one.",
    src: "Pierrehumbert 2011; Yang et al. 2013; Kopparapu et al. 2013. One number stands for the whole greenhouse; oceans carry no heat; tuned so that Earth comes out at 288 K." },
  { n: 9, plain: "A giant has no ground. What you see is the top of its atmosphere, and what forms there depends on temperature: ice clouds when cold, clear blue depths when warm, clouds of rock droplets when very hot.",
    goes: [`Temperature (step 3) ${S_(1)}`, `Mass, radius, year, age ${S_(0)} or ${S_(1)}`, `One face to the star (step 5) ${S_(1)}`],
    rule: `<p><b>Top layer by temperature,</b> for giants lit by their star (after Sudarsky et al. 2000): below 150 K, ammonia-ice clouds; to 350 K, water clouds; to 800 K, no clouds, deep and blue; to 1,400 K, dark, where sodium and potassium soak up light; to 2,000 K, clouds of rock droplets (silicates); above that, too hot for any cloud. Colours blend smoothly between these.</p>
      <p><b>Giants that glow with their own heat</b> (own heat more than 1.2 times the starlight temperature) follow failed stars (brown dwarfs) of the same temperature: thick, red dust clouds when hot, clearing below about 1,250 K (1,050 K under gravity below 100 m/s²), water clouds below 450 K.</p>
      <p><b>Day and night</b> on a giant with one face to its star: winds carry a share <code>ε = 1 / (1 + (T/1500)³)</code> of the heat round. Day side: <code>T₀ (2/3 − 5ε/12)^¼</code>, with <code>T₀ = T★ √(R★/a)</code>. Night side: <code>T₀ (ε/4)^¼</code>, except that between 1,000 and 2,300 K it is taken as <code>800 + 0.15 (T − 1200)</code> K, kept between 700 and 1,150 K, because measured night sides cluster there. Hottest point: <code>30ε + 5</code> degrees east of the point under the star.</p>
      <p><b>Details:</b> heavy elements <code>3 × (M_Jupiter / M)</code> times the Sun's share (1 to 300); salt clouds between 600 and 1,400 K; yellow sulfur haze between 350 and 800 K in air rich in heavy elements; methane below 1,000 K turns the planet blue-green; bands number <code>6 √((R / R_Jupiter) × (10 hours / day))</code> per hemisphere; spin flattens the globe and a close star stretches it.</p>
      <p><b>Sub-Neptunes</b> are drawn by the same model, with a haze whose thickness grows with how puffed-up the atmosphere is, strongest between 350 and 950 K.</p>
      <p><b>Where you float:</b> at 0.1 bar, above the top layer.</p>`,
    out: "The colours and bands of the cloud tops, day and night temperatures, the place of the hottest point, and the haze above you.",
    obs: () => `Measurements replace parts of this step on ${countMeas()} planets: day-side temperature (${countMeas("Tday")}), night-side temperature (${countMeas("Tnight")}), the shift of the hottest point (${countMeas("hotOff")}), spin (${countMeas("rotH")}), and a measured colour or brightness (${countMeas("deck") + countMeas("bright") + countMeas("scale")}).`,
    src: "Sudarsky et al. 2000; Keating et al. 2019; Gao et al. 2020; Marley et al. 2012. Band patterns and storms are borrowed from the Solar System's giants; measured hot-spot shifts do not follow the formula closely." },
  { n: 10, plain: "Very close to a star, bare rock melts. The guide finds where the surface is molten and how hot the day side gets.",
    goes: [`Star temperature and radius, orbit size ${S_(0)}`],
    rule: `<p><b>Molten</b> where bare ground would pass about 1,650 K. Under the star that temperature is <code>T★ √(R★/a)</code>, and it falls as the fourth root of the cosine of the angle away from that point. You stand 8° inside the edge of the molten region, at most 60° from the point under the star.</p>
      <p><b>Day side as a whole:</b> the hottest a bare, dark rock can be is <code>T★ √(R★/a) × (2/3)^¼</code>. Where that passes 2,400 K the guide uses 85% of it, because the lava worlds measured so far are cooler than the limit.</p>
      <p><b>Glow:</b> the lava shines with the colour of a perfect radiator at its temperature. Beside the star it is faint, so the day side looks dark.</p>`,
    out: "Where you stand on a lava world, its temperature, and the colour of its glow.",
    obs: () => "A measured day side replaces the 85% rule on K2-141 b and HD 3167 b; TOI-2431 b was measured at the limit and keeps it.",
    src: "Cowan & Agol 2011; Zieba et al. 2022; Coy et al. 2026. The 85% rests on a handful of planets, and whether they are cooler because of air or of bright cloud is not known." },
  { n: 11, plain: "Air scatters starlight, blue most strongly, and that scattered light is the sky. How much colour the sky gets depends on the gas, how much of it there is, and which colours the star sends. With no air, the sky is black.",
    goes: [`The star's spectrum (step 2) ${S_(1)}`, `This world's gas and pressure ${S_(2)}, or ${S_(0)} where observed`, `Gravity ${S_(1)}`, `Haze or dust ${S_(2)}`],
    rule: `<p><b>Scattering strength</b> at 550 nm: <code>τ = 0.097 × P × k × (9.81 / g)</code>, with P in bar and g in m/s². k is 1 for nitrogen, 2.8 for hydrogen, 1.6 for carbon dioxide and 1.3 for nitrogen mixed with carbon dioxide. Earth's air gives 0.097. Strength varies as <code>1/λ⁴</code>, so blue (450 nm) scatters 2.2 times as strongly as yellow.</p>
      <p><b>Haze and dust</b> add scattering that is the same at every wavelength and takes the colour of the haze: the ground's colour for dust, orange for organic haze, the cloud tops' colour on a world of gas.</p>
      <p><b>The sky in each direction</b> is starlight scattered once on its way to you, brightened by <code>1 + 0.8 τ</code> to stand for light scattered more than once. In thin air this gives a sky coloured by the blue end of the star's light. In deep air, where τ is near 1 or above, every colour is scattered, and the sky takes the colour of the starlight itself.</p>
      <p><b>The star seen through air</b> is dimmed by <code>exp(−τ m)</code>, where m is the amount of air along the line of sight, and so reddens toward the horizon.</p>
      <p><b>Clouds:</b> water clouds are drawn where the air is between 230 and 330 K; their amount comes from step 8 or from the world's own setting, and their shapes are imagined.</p>
      <p><b>Colour as seen:</b> as in step 2.</p>`,
    out: "The colour of the sky in every direction, the colour of daylight on the ground, and the clouds.",
    obs: () => "Where a telescope has shown that a planet has no air, the sky is black for that reason. A measured haze sets the haze on a few giants.",
    src: "Standard physics of scattering; the handling of light scattered more than once is rough, so the skies of very deep atmospheres are the least certain." },
  { n: 12, plain: "The ground's colour and roughness follow from what it is made of, the gravity, and whether there is air to wear it down. The exact shapes are imagined.",
    goes: [`Gravity ${S_(1)}`, `This world's ground and air (step 7) ${S_(2)} or ${S_(0)}`, `Age ${S_(0)}`, `A measured surface, on a few planets ${S_(0)}`],
    rule: `<p><b>Height of the land:</b> <code>420 m / (gravity against Earth's)</code>, kept between 90 and 1,100 m; 30% lower under air thicker than 3 bar, 60% lower on ice.</p>
      <p><b>Without air</b> nothing wears the surface down: craters, sharp ridges and black shadows, more craters in systems older than 6 billion years, and rock darkened by ages of exposure in systems older than 5 billion. <b>With air:</b> rounded hills, layered cliffs, and dunes on dusty or icy ground.</p>
      <p><b>Rock colour:</b> the dark grey of basalt, mixed by chance toward pale highland rock (10 to 60%) or rust (up to 50% under air, 75 to 95% on a desert world). Frost is added below 240 K. Lava worlds get a dark, freshly frozen crust.</p>
      <p><b>Seas</b> use the reflectance of seawater, a few per cent, strongest in blue. <b>Ice</b> uses that of snow and glacier ice.</p>`,
    out: "The ground you stand on.",
    obs: () => "A measured surface replaces the chance rock mix on LHS 3844 b (dark, basalt-like rock, no sign of volcanoes) and TRAPPIST-1 b (dark, iron-rich rock).",
    src: "Rock, ice and water colours are fits to laboratory and Solar System measurements. Hills, coasts and rocks are imagined: only their scale and colour follow from physics." },
  { n: 13, plain: "Other planets of the same star, a second star, and stars of the night are placed in the sky where they would be. Moons are never drawn on the ground and are always imagined.",
    goes: [`Orbits and sizes of the other planets ${S_(0)} or ${S_(1)}`, `Mass, radius, orbit, age ${S_(0)} or ${S_(1)}`],
    rule: `<p><b>Neighbouring planets:</b> each is drawn at its largest, <code>2 asin(R / |a₁ − a₂|)</code> across, and grey, because nobody knows its surface.</p>
      <p><b>Could a moon survive?</b> A moon is tried at 0.4 of the distance within which the planet's gravity beats the star's. If that lies inside 3 planet radii there is no room. Otherwise tides pull the moon away in a time <code>t = (2/13) a^6.5 Q / (3 k₂ q R⁵ √(G M))</code>, with Q = 100 and a moon like ours (q = 0.0123) for rocky planets, Q = 100,000 and q = 0.00008 for giants. If t is longer than the system's age, an imagined moon is drawn in the sky.</p>
      <p><b>Auroras</b> are drawn in the air of planets of red dwarfs, whose flares would feed them: pink in hydrogen, green in carbon dioxide, violet-blue in nitrogen.</p>`,
    out: "Neighbouring planets, a second star, an imagined moon, auroras.",
    obs: () => "No moon of any exoplanet has been confirmed. The two best candidates (round Kepler-1625 b and Kepler-1708 b) are disputed, and the text for those planets says so.",
    src: "Barnes & O'Brien 2002. The test says only whether a large moon could last, not whether one exists." },
  { n: 14, plain: "The whole planet, seen from space, is coloured by the same ground, air and cloud as the view from the surface.",
    goes: [`This world's ground, air and cloud (steps 7 to 12) ${S_(2)} or ${S_(0)}`, `The star's spectrum ${S_(1)}`],
    rule: `<p>Each point of the lit half reflects the starlight that reaches it: sea, ice, rock or cloud, each with its own reflectance. Air adds scattered light with the same strength τ as in step 11, so a thick atmosphere veils the globe in the colour of the starlight. Rock hotter than 1,600 K glows. Cloud covers the share of the day side given by step 8. The night half is dark.</p>
      <p>A world of gas is drawn by the giant model of step 9: bands, storms, the day and night sides and the shifted hot spot.</p>`,
    out: "The globe, the small globe that shows where you stand, and the planet's dot in the view of the whole system.",
    obs: () => "A measured colour is used where there is one (HD 189733 b: deep blue).",
    src: "The globe uses a simpler treatment of air than the sky does, so the two can differ a little in tint." },
  { n: 15, plain: "No life has been found beyond Earth. The guide draws none unless you ask, and then only on worlds with liquid water at the surface. All of it is imagined, though each choice follows a property of the planet.",
    goes: [`A world with a surface ocean and air (step 7) ${S_(2)}`, `Starlight, gravity, temperature ${S_(1)}`],
    rule: `<p><b>Where:</b> only worlds with open water and air. <b>What:</b> microbes on shores, then plants, then animals. Animals need air of at least 0.3 bar that is not mostly hydrogen, plants to eat, and a system older than 2 billion years.</p>
      <p><b>Plant colour</b> follows the starlight: near-black or purple under stars cooler than 4,200 K, where visible light is scarce, and green otherwise (Kiang et al. 2007). <b>Plant cover</b> follows the light plants can use (400 to 750 nm) and thins below a quarter of Earth's (Lehmer et al. 2018). <b>What grows where</b> follows temperature and rainfall, as on Earth; nothing grows above about 330 K.</p>
      <p><b>Animals</b> get one body plan per planet: longer legs under low gravity, six thick legs above 1.4 times Earth's, dark hides under red dwarfs.</p>`,
    out: "Microbial mats, plants and animals, when “Imagine life” is on.",
    obs: () => "Nothing: no exoplanet's oxygen, or any sign of life, has been measured.",
    src: "Kiang et al. 2007; Lehmer et al. 2018; Catling et al. 2005. These illustrate the rules. They are not predictions." },
  { n: 16, plain: "Some things in a picture are decided by chance, because no rule decides them. The chance is fixed by the planet's name, so a picture is the same on every visit and for every visitor.",
    goes: ["The planet's name, the world's name and the place where you stand"],
    rule: `<p>A fixed sequence of random numbers is started from that text. It decides: the layout of hills, coast and rocks; the mix of rock colours within the limits of step 12; whether a volcano stands on the horizon (4 chances in 10 on rocky ground); the wind direction on a planet whose spin is unknown; on giants, the number and place of storms, an assumed day of 8 to 22 hours where the spin is unknown, and the mix of bright and orange haze on small gas planets.</p>`,
    out: "The parts of a picture marked imagined.",
    obs: () => "A measurement always wins over a random choice: a measured spin, a measured rock, or a paper that finds no volcanoes.",
    src: "To reproduce a picture exactly you need this sequence, which the code provides; everything else on this page can be followed by hand." },
];
function countMeas(k) { if (typeof GIANT === "undefined") return 0; const v = Object.values(GIANT.MEAS); return k ? v.filter(m => m[k] != null).length : v.length; }
function countObs() { let n = 0; for (const r of CAT) { try { if (lookedAt(catWorld(r[0]))) n++; } catch (e) {} } return n; }

let rW = null, rSi = 0;
function recipeWorld(key) { if (!key) return null; return ALL.find(w => w.id === key || w.name === key || archName(w) === key) || (CAT_NORM.get(normName(key)) ? catWorld(CAT_NORM.get(normName(key))) : null); }
function renderRecipe() {
  const T = rW ? traceOf(rW, rW.scenarios[rSi], { odds: true }) : null, pn = rW ? archName(rW) : "", used = new Set();
  document.getElementById("rWho").innerHTML = rW ? `Showing the values for <b>${dispName(rW)}</b>${rW.scenarios.length > 1 ? `, world: <select id="rWorld" aria-label="World">${rW.scenarios.map((s, i) => `<option value="${i}" ${i === rSi ? "selected" : ""}>${worldTitle(rW, s)}</option>`).join("")}</select>` : `: ${lc1(worldTitle(rW, rW.scenarios[0]))}`}. <a href="./#${ALL.includes(rW) ? rW.id : "pl-" + normName(rW.name)}">See its picture →</a> <button class="chip" type="button" id="rClear">Show the steps alone</button>` : "Choose a planet to see its own values beside every step.";
  document.getElementById("rsteps").innerHTML = RSTEPS.map(s => {
    const rows = T && T.steps[s.n] ? T.steps[s.n] : null;
    const mine = !rW ? "" : `<div class="mine"><h4>For ${dispName(rW)}</h4>${rows ? `<ul>${rows.map(r => `<li><b>${r.label}:</b> ${linkCites(r.value, pn, used)} ${srcTag(r.src)}</li>`).join("")}</ul>` : `<p class="hint">This step does not apply to the world chosen${s.n === 8 ? " (it has no air over a surface)" : s.n === 9 ? " (it is not a world of gas)" : s.n === 10 ? " (nothing is molten)" : ""}.</p>`}</div>`;
    return `<section class="rstep${rW ? " two" : ""}" id="step${s.n}"><div class="gen"><h2><span class="num">${s.n}</span> ${STEP_TITLES[s.n]}</h2><p class="plain">${linkCites(s.plain, "")}</p>
      <h4>Goes in</h4><ul>${s.goes.map(x => `<li>${linkCites(x, "")}</li>`).join("")}</ul><h4>The rule</h4>${linkCites(/^</.test(s.rule) ? s.rule : `<p>${s.rule}</p>`, "")}<h4>Comes out</h4><p>${linkCites(s.out, "")}</p>
      <h4>When an observation replaces it</h4><p>${linkCites(s.obs(), "")}</p><h4>Source and limits</h4><p>${linkCites(s.src, "")}</p></div>${mine}</section>`; }).join("")
    + `<section class="rstep" id="step17"><div class="gen"><h2><span class="num">17</span> ${STEP_TITLES[17]}</h2><p class="plain">The steps are tested against planets that have been studied closely, including the Solar System's, whose answers are known. A failing test marks a rule to improve.</p><div id="bench"></div></div></section>`;
  convertTemps(document.getElementById("rsteps"));
  const rows = runBenchmarks(), pass = rows.filter(r => r.ok).length;
  document.getElementById("bench").innerHTML = `<p><b>${pass} of ${rows.length}</b> tests pass, on ${BENCH.length} planets.</p><details><summary>Every test, failures first</summary><div class="tablewrap"><table class="rtab"><thead><tr><th>Result</th><th>Planet</th><th>Test</th><th>The guide gives</th><th>Expected</th><th>Source</th></tr></thead><tbody>${rows.slice().sort((a, b) => a.ok - b.ok).map(r => `<tr><td class="${r.ok ? "ok" : "bad"}">${r.ok ? "pass" : "fail"}</td><td>${r.p}</td><td>${r.test}</td><td>${r.got}</td><td>${r.want}</td><td>${linkCites(r.ref, r.p)}</td></tr>`).join("")}</tbody></table></div></details>`;
  const sel = document.getElementById("rWorld"); if (sel) sel.onchange = () => { rSi = +sel.value; setHash(); renderRecipe(); };
  const cl = document.getElementById("rClear"); if (cl) cl.onclick = () => { rW = null; setHash(); renderRecipe(); };
}
function setHash() { try { history.replaceState(null, "", rW ? `#p=${encodeURIComponent(ALL.includes(rW) ? rW.id : archName(rW))}&w=${rSi}` : location.pathname); } catch (e) {} }
function recipeStart() {
  const h = new URLSearchParams(location.hash.slice(1)), stepOnly = (location.hash.match(/^#step(\d+)$/) || [])[1];
  rW = recipeWorld(h.get("p")); rSi = rW ? Math.max(0, Math.min(rW.scenarios.length - 1, +(h.get("w") || 0))) : 0;
  renderRecipe();
  const q = document.getElementById("rq");
  q.onfocus = () => { const dl = document.getElementById("rq-list"); if (!dl.childElementCount) dl.innerHTML = CAT.map(r => `<option value="${r[0].replace(/"/g, "&quot;")}">`).join(""); };
  const go = () => { const w = recipeWorld(q.value.trim()); document.getElementById("rmsg").textContent = w || !q.value.trim() ? "" : `No planet is called “${q.value.trim()}”.`; if (w) { rW = w; rSi = 0; q.value = ""; setHash(); renderRecipe(); } };
  q.onchange = go; q.onkeydown = e => { if (e.key === "Enter") go(); };
  document.querySelectorAll("[data-ex]").forEach(b => b.onclick = () => { rW = recipeWorld(b.dataset.ex); rSi = 0; setHash(); renderRecipe(); });
  const st = h.get("step") || stepOnly; if (st) { const el = document.getElementById("step" + st); if (el) { el.scrollIntoView({ block: "start" }); el.classList.add("flash"); } }
}
