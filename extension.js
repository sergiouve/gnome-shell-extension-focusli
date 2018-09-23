/* global imports, log */

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Sound = Extension.imports.sound;
const Loader = Extension.imports.loader;

const St = imports.gi.St;
const Clutter = imports.gi.Clutter;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const GLib = imports.gi.GLib;
const Lang = imports.lang;
const Gio = imports.gi.Gio;

const NoiserPopup = new Lang.Class({
    Name: 'NoiserPopup',
    Extends: PopupMenu.PopupBaseMenuItem,

    _init: function() {
        this.parent({
            reactive: false,
            can_focus: false,
        });

        this.box = new St.BoxLayout({
            vertical: true,
        });
        this.actor.add(this.box);

        this.loader = new Loader.Loader();
        this.loader.connect('sounds-loaded', this._onSoundsReady.bind(this));
    },

    _onSoundsReady: function() {
        const sounds = this.loader.sounds;

        for (let iterator = 0; iterator < sounds.length; iterator += 2) {
            const leftSoundComponent = new Sound.SoundComponent(sounds[iterator]);
            const rightSoundComponent = new Sound.SoundComponent(sounds[iterator + 1]);
            const line = new St.BoxLayout();

            line.add_child(leftSoundComponent);
            line.add_child(rightSoundComponent);

            this.box.add_child(line);
        }
    }
});

const NoiserButton = new Lang.Class({
    Name: 'NoiserButton',
    Extends: PanelMenu.Button,

    _init: function () {
        this.parent(0, 'Noiser');

        const box = new St.BoxLayout({
            style_class: 'panel-status-menu-box'
        });

        const icon_path = GLib.build_filenamev([Extension.dir.get_path(), "wave.png"]);
        const gicon = Gio.Icon.new_for_string(icon_path);
        const icon = new St.Icon({
            gicon: gicon,
            style_class: 'system-status-icon'
        });
        box.add_child(icon);
        this.actor.add_child(box);

        const popup = new NoiserPopup();
        this.menu.addMenuItem(popup);
    }
});

let button;

function init() {
    // TODO?
}

function enable() {
    Main.panel.addToStatusArea('NoiserButton', new NoiserButton, 0, 'right');
}

function disable() {
    button.destroy();
}
