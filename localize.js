/**
 * Adapted for Localize from original module: https://github.com/SvenWerlen/fvtt-data-toolbox
 */
const itemInserted = [];

function dtShowExport() {
    renderTemplate("modules/swade-it-helper/templates/dialog-localize-export.html", {
        compendium:  Array.from(game.packs.filter(p => p.locked === false))
    }).then(html => { (new GenerateCompendiumDialogExport(null, {html: html})).render(true); }
    );
}

function dtShowImport() {
    renderTemplate("modules/swade-it-helper/templates/dialog-localize.html", {
        csv: game.settings.get("localize", "csv"),
        compendium:  Array.from(game.packs.filter(p => p.locked === false))
    }).then(html => { (new GenerateCompendiumDialogImport(null, {html: html})).render(true); }
    );
}

function dtShowTranslation() {
    renderTemplate("modules/swade-it-helper/templates/dialog-localize-translation.html", {
        csv: game.settings.get("localize", "csv"),
        compendium:  Array.from(game.packs.filter(p => p.locked === false))
    }).then(html => { (new GenerateCompendiumDialogTranslation(null, {html: html})).render(true); }
    );
}

Hooks.once("init", () => {

    loadTemplates([
        "modules/swade-it-helper/templates/dialog-localize.html",
        "modules/swade-it-helper/templates/dialog-localize-export.html",
        "modules/swade-it-helper/templates/dialog-localize-translation.html"
    ]);
    game.settings.register("localize", "csv", { scope: "world", config: false, type: String, default: "modules/swade-it-helper/csv/actors.csv" });

});


class GenerateCompendiumDialogImport extends Dialog {

    constructor(callback, options) {
        if (typeof(options) !== "object") {
            options = {};
        }

        super({
            title: game.i18n.localize("LOCALIZE.importTitle"),
            content: options.html,
            buttons: {
                generate: {
                    label: game.i18n.localize("LOCALIZE.import"),
                    dontclose: true,
                    callback: (html) => this._generate(html)
                },
                cancel: {
                    label: game.i18n.localize("LOCALIZE.cancel")
                },
            },
            default: "generate",
            close: (dialog) => {
                //console.log(dialog);
            }
        });
    }

    activateListeners(html) {
        super.activateListeners(html);

        // Detect and activate file-picker buttons
        html.find('button.file-picker').each((i, button) => this._activateFilePicker(button));
    }

    _activateFilePicker(button) {
        button.onclick = event => {
            event.preventDefault();
            FilePicker.fromButton(button).browse();
        }
    }

    _submit(button, html) {
        try {
            if (button.callback) button.callback(html);
            if (!button.dontclose) this.close();
        } catch(err) {
            ui.notifications.error(err);
            throw new Error(err);
        }
    }

    async _generate(html) {
        let csv = html.find('input[name="csv"]').val();
        let compendiumKey = html.find('select[name="compendium"]').val();


        const pack = game.packs.get(compendiumKey);
        //get the index of the compendium
        let id2Name = [];
        pack.getIndex().then(index => index.forEach(function (arrayItem) {
            id2Name[arrayItem.id] = arrayItem.name;
        }));

        if (csv.length === 0) {
            ui.notifications.error(game.i18n.localize("LOCALIZE.tbNoSource"));
        }
        else {
            game.settings.set("localize", "csv", csv);

            // load data (as CSV)
            let data;
            try {
                data = await d3.csv(csv);
            } catch(err) {
                ui.notifications.error(game.i18n.localize("LOCALIZE.tbInvalidCSV"));
                throw new Error(err);
            }

            let totalCount = 0;

            let jsonData;
            try {
                ui.notifications.info(game.i18n.localize("LOCALIZE.processStarted"))
                for(let i=0; i<data.length; i++) {

                    if (i % 250 == 0 && i != 0) {
                        ui.notifications.info(game.i18n.format("LOCALIZE.inProcess", {count: i, total: totalCount}));
                    }

                    jsonData = JSON.unflatten(data[i]);

                    let itemID = "";
                    if(jsonData.id && jsonData.id !== "") {
                        //get by id from the compendium
                        itemID = jsonData.id;
                    }
                    else if(jsonData.name && jsonData.name !== "")  {
                        const tmp = id2Name.find(p => p.id = jsonData.id);
                        jsonData.id = tmp.id;
                    }

                    if(jsonData.id && jsonData.id !== "") {

                        console.log('***************  CHECK IF id ' + jsonData.id +' DOES EXIST ********************');

                        if(id2Name[jsonData.id]){
                            console.log('***************  id ' + jsonData.id +' FOUND ********************');
                            //console.log(Promise.all(await pack.getEntry(jsonData.id)));
                            //Try to update the Entity
                            await pack.updateEntity(jsonData);
                            //console.log(Promise.all(await pack.getEntry(jsonData.id)));
                            totalCount++;
                        }
                    }
                    //else create new entity with pack.createEntity(jsonData)
                }
                const entity = pack.metadata.entity;
                pack.render(true);
                ui.notifications.info(game.i18n.format("LOCALIZE.processCompleted", {count: totalCount, type: entity}));
            } catch(err) {
                ui.notifications.error(game.i18n.localize("LOCALIZE.tbGenerationError"));
                throw new Error(err);
            }
        }
    }

    format(text, data={}) {
        const fmt = /\{\{[^\}]+\}\}/g;
        text = text.replace(fmt, k => {
            return data[k.slice(2, -2)];
        });
        return text;
    }
}

class GenerateCompendiumDialogExport extends Dialog {

    constructor(callback, options) {
        if (typeof(options) !== "object") {
            options = {};
        }

        super({
            title: game.i18n.localize("LOCALIZE.exportTitle"),
            content: options.html,
            buttons: {
                generate: {
                    label: game.i18n.localize("LOCALIZE.export"),
                    dontclose: true,
                    callback: (html) => this._generate(html)
                },
                cancel: {
                    label: game.i18n.localize("LOCALIZE.cancel")
                },
            },
            default: "generate",
            close: (dialog) => { console.log(dialog); }
        });
    }

    activateListeners(html) {
        super.activateListeners(html);
    }

    _submit(button, html) {
        try {
            if (button.callback) button.callback(html);
            if (!button.dontclose) this.close();
        } catch(err) {
            ui.notifications.error(err);
            throw new Error(err);
        }
    }

    async _generate(html) {
        let compendiumKey = html.find('select[name="compendium"]').val();
        let format = html.find('input[name="format"]:checked').val();
        const pack = game.packs.get(compendiumKey);

        let finalList = {};

        let cleanActor = (actor) => {
            //TODO unset items and other objects or convert them in something that can be exported
            //delete actor.items; //TODO NON funziona
            return actor;
        }

        let parseItem = async(actor) => {
            console.log('trying to export ' + actor.name );
            const finalItem = JSON.flatten(cleanActor(actor.toJSON()))
            if(format === 'csv') {
                finalList.push(finalItem);
            }
            else {
                const key = finalItem.id;
                delete finalItem.id;
                delete finalItem.img;
                delete finalItem[`flags.cf.path`];
                delete finalItem[`flags.cf.name`];
                if (!isObjectEmpty(finalItem)) {
                    finalList[key] = finalItem;
                }
            }
        }

        let content = await pack.getDocuments();


        for ( let entity of content ) {
            await parseItem(entity)
        }

        const entity = pack.metadata.name.toLowerCase();

        if(format === 'csv') {
            const csv = d3.csvFormat(finalList);
            const blob = new Blob([csv], { type: 'text/csv' });
            saveAs(blob, entity + ".csv");
        }
        else {
            const json = JSON.stringify(finalList);
            const blob = new Blob([json], { type: 'text/json' });
            saveAs(blob, entity + ".json");
        }

    }

}

class GenerateCompendiumDialogTranslation extends Dialog {

    constructor(callback, options) {
        if (typeof(options) !== "object") {
            options = {};
        }

        super({
            title: game.i18n.localize("LOCALIZE.translateTitle"),
            content: options.html,
            buttons: {
                generate: {
                    label: game.i18n.localize("LOCALIZE.translate"),
                    dontclose: true,
                    callback: (html) => this._generate(html)
                },
                cancel: {
                    label: game.i18n.localize("LOCALIZE.cancel")
                },
            },
            default: "generate",
            close: (dialog) => { console.log(dialog); }
        });
    }

    activateListeners(html) {
        super.activateListeners(html);
    }

    _submit(button, html) {
        try {
            if (button.callback) button.callback(html);
            if (!button.dontclose) this.close();
        } catch(err) {
            ui.notifications.error(err);
            throw new Error(err);
        }
    }

    async _generate(html) {

        let compendiumKey = html.find('select[name="compendium"]').val();
        let content;

        if(compendiumKey === 'actors') {
            content = game.actors;
        }
        else {
            const pack = game.packs.get(compendiumKey);
            content = await pack.getContent();
        }

        let translateItems = async(actor) => {

            const itemsToUpdate = [];

            for (let i = 0; i < actor.getEmbeddedCollection('Item').contents.length; i++) {
                const item = actor.getEmbeddedCollection('Item').contents[i];
                const translatedData = await translateItem(item)
                if(translatedData !== null && translatedData !== undefined) {
                    itemsToUpdate.push( mergeObject(translatedData, { _id: item.id ,'flags.loc.translated': true }));
                }
            }

            if(itemsToUpdate.length > 0) {
                console.log(itemsToUpdate)
                await actor.updateEmbeddedDocuments("Item", itemsToUpdate);
            }
        }

        let translateItem = async (item) => {

            //TODO se armi convertire anche le azioni
            //Usa get / set flag
            if ((item.flags !== undefined
                    && item.flags.loc !== undefined
                    && item.flags.loc.translated)
                || (
                    item.flags !== undefined
                    && item.flags.babele !== undefined
                    && item.flags.babele.translated === true
                )
            ) {
                //console.log('item ' + item.name + ' already translated');
                return null;
            }
            let patchedItem;
            if (['weapon', 'armor', 'shield', 'gear'].includes(item.type)) {
                patchedItem = await translateFromPack(item, ["swade-equipment"]);
            } else if (item.type === "hindrance") {
                patchedItem = await translateFromPack(item, ["hindrances"]);
            } else if (item.type === "edge") {
                patchedItem = await translateFromPack(item, ["edges"]);
            } else if (item.type === "skill") {
                patchedItem = await translateFromPack(item, ["skills"], ['description']); //TODO make the skip multilevel
            } else if (item.type === "power") {
                patchedItem = await translateFromPack(item, ["swade-powers"]);
            } else if (item.type === "ability") {
                patchedItem = await translateFromPack(item, ["swade-specialabilities"]);
            }
            return patchedItem;
        }

        (await Promise.all(content)).forEach(entity => {
            if(entity !== undefined
                && entity !== null
                && entity.items !== undefined
                && entity.items !== null
            ) {

                translateItems(entity)
            }
            else {
                console.log('NON VA BENE');
                console.log(entity);
            }
        })

    }

}

JSON.unflatten = function(data) {
    "use strict";
    if (Object(data) !== data || Array.isArray(data))
        return data;
    var result = {}, cur, prop, parts, idx;
    for(var p in data) {
        cur = result, prop = "";
        parts = p.split(".");
        for(var i=0; i<parts.length; i++) {
            idx = !isNaN(parseInt(parts[i]));
            cur = cur[prop] || (cur[prop] = (idx ? [] : {}));
            prop = parts[i];
        }
        //TODO TBChecked do not create the field if is empty
        //was only  cur[prop] = data[p]; without the if
        if(data[p]) {
            cur[prop] = data[p];
        }
    }
    return result[""];
}
JSON.flatten = function(data) {
    const result = {};

    //Note by Suppo: we want to export for translations
    // only fields with a value, so we skip all fields empty, false, etc..
    // we also try to skip the numeric ones
    // TODO fare check migriori, magari in funzione apposita
    function recurse (cur, prop) {
        if (Object(cur) !== cur) {
            if(isTranslatable(prop, cur))
                result[prop] = cur;
        } else if (Array.isArray(cur)) {
            let l=cur.length;
            let i=0;
            for(; i<l; i++)
                recurse(cur[i], prop ? prop+"."+i : ""+i);
            if (l === 0){
                // do nothing
                // was result[prop] = [];
            }
        } else {
            let isEmpty = true;
            for (const p in cur) {
                isEmpty = false;
                recurse(cur[p], prop ? prop+"."+p : p);
            }
            if (isEmpty) {
                //do nothing
                // was result[prop] = ""; //and before was {}
            }
        }
    }
    recurse(data, "");
    return result;
}

function isTranslatable(key, value) {
    if(
        ( key.includes('flags.cf')
            && !key.includes('path')
            && !key.includes('name')
        ) ||  key.includes('flags.exportSource')
        ||  key.includes('flags.importInfo')
        ||  key.includes('items.')
        || value === true

    )
    {
        return false;
    }
    return isNaN(value);

}

async function translateFromPack(item, packs, skip = []) {

    //Search also in the pack we created
    const itemType =  item.type.toLowerCase();
    const missingTranslationPackCheck = game.packs.get("world.missing-translations-" + itemType);
    if(missingTranslationPackCheck) {
        //do something
        console.log('pack found!');
    }
    else {
        console.log('pack not found, let\'s create it');
        //create the pack
        const metadata = {name: "missing-translations-" + itemType, label: "Missing Translations " + itemType.capitalize(), path: "packs/missing-translations.db", entity: 'Item'};
        await CompendiumCollection.createCompendium(metadata);
    }

    packs.push("missing-translations-" + itemType);

    for (let packName of packs) {
        let pack = game.babele.packs.find(pack => pack.translated && pack.translations[item.name] && pack.metadata.name == packName);
        if(pack) {
            return pack.translate(item.data, true);
        }
    }

    const missingTranslationPack = game.packs.get("world.missing-translations-" + itemType);
    if(missingTranslationPack) {
        const hash = CryptUtil.md5(item.name + item.type + item.system.description);
        //do something
        let foundItem = (await missingTranslationPack.getDocuments()).find(el => (el.name === item.name && el.type === item.type));
        //Search the item here
        if (foundItem === undefined || foundItem === null) {
            //See if I already inserted it
            if(itemInserted[hash] !== 1){
                itemInserted[hash] = 1;
                //TODO if not present add it
                Item.create(item.data, {pack: "world.missing-translations-" + itemType});
            }
        }
    }
    return null;
}
