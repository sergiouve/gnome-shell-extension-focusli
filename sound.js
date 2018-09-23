/* global imports */

const Extension = imports.misc.extensionUtils.getCurrentExtension();

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gst = imports.gi.Gst;
const GstAudio = imports.gi.GstAudio;
const Lang = imports.lang;
const Loader = Extension.imports.loader;
const Slider = imports.ui.slider;
const St = imports.gi.St;

const DEFAULT_VOLUME = 0.5;

const SoundComponent = new Lang.Class({
    Name: 'SoundComponent',
    Extends: St.BoxLayout,
    Properties: {
        'sensitive': GObject.ParamSpec.boolean('sensitive', 'Sensitive',
            'Whether the widget is sensitive',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, false),
    },

    set sensitive(s) {
        this._sensitive = s;

        this.opacity = s ? 255 : 100;
    },

    get sensitive() {
        return this._sensitive;
    },

    _init: function (sound) {
        this.parent ({
            style_class: 'soundbox flat',
            vertical: true,
        });

        let icon = new St.Icon({
            style_class: 'icon',
            icon_name: sound.icon,
            reactive: true,
        });
        this.add_child(icon);

        let slider = new Slider.Slider (DEFAULT_VOLUME);
        this.add_child (slider.actor);

        slider.connect('value-changed', this._onValueChanged.bind (this));

        this.player = new SoundPlayer(sound);

        icon.connect('button-press-event', Lang.bind(this, function() {
            if (this.sensitive) {
                this.player.pause();
            } else {
                this.player.play();
            }

            this.sensitive = ! this.sensitive;
        }));
    },

    _onValueChanged: function(slider, value, property) {
        this.player.setVolume(value);

        this.sensitive = (value > 0);
    },
});

const SoundPlayer = new Lang.Class({
    Name: 'SoundPlayer',

    _init: function (sound) {
        this.playbin = Gst.ElementFactory.make("playbin", sound.name);
        this.playbin.set_property("uri", this.getUri(sound));
        this.sink = Gst.ElementFactory.make("pulsesink", "sink");
        this.playbin.set_property("audio-sink", this.sink);

        this.prerolled = false;
        let bus = this.playbin.get_bus();
        bus.add_signal_watch();
        bus.connect("message", Lang.bind(this, function(bus, msg) {
            if (msg != null)
                this._onMessageReceived(msg);
        }));
    },

    play: function() {
        this.playbin.set_state(Gst.State.PLAYING);
    },

    pause: function() {
        this.playbin.set_state(Gst.State.NULL);
        this.prerolled = false;
    },

    setVolume: function(value) {
        this.playbin.set_volume(GstAudio.StreamVolumeFormat.LINEAR, value);

        let [rv, state, pstate] = this.playbin.get_state(Gst.State.NULL);
        if (value == 0) {
            this.playbin.set_state(Gst.State.NULL);
        } else if (state != Gst.State.PLAYING) {
            this.playbin.set_state (Gst.State.PLAYING);
        }
    },

    _onMessageReceived: function(message) {
        if (message.type == Gst.MessageType.SEGMENT_DONE) {
            this.playbin.seek_simple(Gst.Format.TIME, Gst.SeekFlags.SEGMENT, 0);
        }
        if (message.type == Gst.MessageType.ASYNC_DONE) {
            if (!this.prerolled) {
                this.playbin.seek_simple (Gst.Format.TIME, (Gst.SeekFlags.FLUSH | Gst.SeekFlags.SEGMENT), 0);
                this.prerolled = true;
            }
        }

        return true;
    },

    getUri: function (sound) {
        /* All URIs are relative to $HOME. */
        return Gst.filename_to_uri (sound.uri);
    },
});
