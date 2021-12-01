const skillDict = {
	'Shooting' : 'Sparare',
	'Fighting' : 'Combattere'
}

const folderDict = {
	'Skills': 'Abilità',
	'Hindrances' : 'Svantaggi',
	'Edges' : 'Vantaggi',
	'Background Edges' : '01 - Vantaggi di Background',
	'Combat Edges' : '02 - Vantaggi di Combattimento',
	'Leadership Edges' : '03 - Vantaggi di Leadership',
	'Power Edges' : '04 - Vantaggi di Potere',
	'Professional Edges' : '05 - Vantaggi Professionali',
	'Social Edges' : '06 - Vantaggi Sociali',
	'Weird Edges' : '07 - Vantaggi Folli',
	'Legendary Edges' : '08 - Vantaggi Leggendari',
	'Powers' : 'Poteri',
	'Equipment' : 'Equipaggiamento',
	'Ammo' : 'Munizioni',
	'Armor' : 'Armature',
	'Common Gear': 'Oggetti comuni', //TODO rivedi con pdf
	'Modern Firearms' : 'Armi da fuoco moderne', //TODO rivedi con pdf
	'Personal Weapons' : 'Armi personali', //TODO rivedi con pdf
	'Special Weapons' : 'Armi speciali', //TODO rivedi con pdf
}

const actionDict = {
	'Close Range' : 'Distanza ravvicinata (Gittata corta/2)',
	'Short Range' : 'Gittata corta',
	'Double-Barrel Short Range' : 'Doppietta Gittata corta',
	'Medium Range' : 'Gittata media',
	'Double-Barrel Medium Range' : 'Doppietta Gittata media',
	'Long Range' : 'Gittata lunga',
	'Double-Barrel Long Range' : 'Doppietta Gittata lunga',
	'Slugs' : 'Proiettili solidi',
	'Double Barrel Slugs' : 'Doppietta con Proiettili solidi',
	'RoF 2 Attack' : 'Attacco CdT 2',
	'RoF 3 Attack' : 'Attacco CdT 3',
	'RoF 4 Attack' : 'Attacco CdT 4',
	'RoF 5 Attack' : 'Attacco CdT 5',
	'Snapfire RoF 2' : 'Bruciapelo CdT 2',
	'Snapfire RoF 3' : 'Bruciapelo CdT 3',
	'Snapfire RoF 4' : 'Bruciapelo CdT 4',
	'Snapfire RoF 5' : 'Bruciapelo CdT 5',
	'Three-Round Burst' : 'Raffica da Tre Colpi',
	'Snapfire' : 'Bruciapelo',
	'Overcharge' : 'Sovraccaricare',
	'One-handed' : 'Ad una mano',
	'Athletics (throwing)' : 'Atletica (lanciare)',
	'Fighting' : 'Combattere',
	'Bash' : 'Sfondare',
}

function parseSkill(value){
	if(skillDict[value] !== null) {
		return skillDict[value];
	}
	else return value;
}

function parseAction(value, translations, data){
	if (isObjectEmpty(value)) {
		return value;
	}
	let toSearch;
	for (const prop in value) {
		if (value.hasOwnProperty(prop)) {
			toSearch = value[prop].name;
			if (actionDict[toSearch] !== undefined) {
				value[prop].name = actionDict[toSearch];
			} else {
				console.log(value[prop].name + " not found for " + data.name + ", please add to actionDict");
			}
		}
	}

	return value;
}

function parseName(value){
	//Parse the translated compendiums to find a match
	let item = {};
	item['_id'] = value;
	let pack = game.packs.find(pack => pack.translated && pack.hasTranslation(item));
	if(pack) {
		return pack.translate(item, true).name;
	}
	//Otherwise return current value
	return value;
}


function parseRequirements(value, translations, data){
	//Parse the translated compendiums to find a match
	let item = {};
	item['_id'] = data.name;
	let pack = game.packs.find(pack => pack.translated && pack.hasTranslation(item));
	if(pack) {
		return pack.translate(item, true).data.requirements;
	}
	//Otherwise return current value
	return value;
}

function parseCfName(value){
	if(folderDict[value] !== null) {
		return folderDict[value];
	}
	else {
		console.log(value);
		return value;
	}
}

Hooks.once('init', () => {

	if(typeof Babele !== 'undefined') {

		Babele.get().register({
			module: 'swade-localize-it',
			lang: 'it',
			dir: 'compendium'
		});

		Babele.get().registerConverters({
			"translateSkill": (value) => parseSkill(value),
			"translateName": (value) => parseName(value),
			"translateRequirements": (value, translations, data) => parseRequirements(value, translations, data),
			"translateCfName": (value) => parseCfName(value),
			"translateAction": (value, translations, data) => parseAction(value, translations, data),
		});
	}
});