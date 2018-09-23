/* global imports, log */

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const GObject = imports.gi.GObject;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Lang = imports.lang;

const EXTENSION_BASE_PATH = Extension.dir.get_path();
const SOUNDS_PATHS = GLib.build_filenamev([EXTENSION_BASE_PATH, "sounds.json"]);

const Loader = new Lang.Class({
    Name: 'Loader',
    Extends: GObject.Object,
    Signals: {
        'sounds-loaded': {},
    },
    sounds: {},

    _init: function() {
        this.parent();
        this.loadSounds();
    },

    loadSounds: function() {
        const file = Gio.File.new_for_path(SOUNDS_PATHS);

        file.load_contents_async(null, (file, res) => {
            try {
                const contents = file.load_contents_finish(res)[1].toString();

                this.sounds = JSON.parse(contents)['sounds'];
                this.emit('sounds-loaded');
            } catch (e) {
                log(e);
            }
        });
    },
});
