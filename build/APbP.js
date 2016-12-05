apbp = {};

apbp.version = "0.1";

apbp.playerIndex = 0;

(function($) {
    apbp.apbpDefaults = {
        poster: "",
        showPosterWhenEnded: false,
        defaultWidth: 480,
        defaultHeight: 270,
        width: -1,
        height: -1,
        aspectRatio: "16:9",
        defaultSeekBackwardInterval: function(media) {
            return media.duration * .05;
        },
        defaultSeekForwardInterval: function(media) {
            return media.duration * .05;
        },
        setDimensions: true,
        startVolume: .8,
        loop: false,
        autoRewind: true,
        enableAutosize: true,
        timeFormat: "",
        alwaysShowHours: false,
        showTimecodeFrameCount: false,
        framesPerSecond: 25,
        autosizeProgress: true,
        alwaysShowControls: false,
        clickToPlayPause: true,
        features: [ "playpause", "current", "progress", "duration", "tracks", "volume", "fullscreen" ],
        hidableControls: true,
        enableKeyboard: true,
        pauseOtherPlayers: true,
        hideVolumeOnTouchDevices: true,
        audioVolume: "horizontal",
        muteText: mejs.i18n.t("Mute Toggle"),
        allyVolumeControlText: mejs.i18n.t("Use Up/Down Arrow keys to increase or decrease volume."),
        playText: mejs.i18n.t("Play"),
        pauseText: mejs.i18n.t("Pause"),
        keyActions: [ {
            keys: [ 32, 179 ],
            action: function(player, media) {
                if (media.paused || media.ended) {
                    media.play();
                } else {
                    media.pause();
                }
            }
        }, {
            keys: [ 38 ],
            action: function(player, media) {
                player.container.find(".apbp-volume-slider").css("display", "block");
                if (player.hidableControls) {
                    player.showControls();
                    player.startControlsTimer();
                }
                var newVolume = Math.min(media.volume + .1, 1);
                media.setVolume(newVolume);
            }
        }, {
            keys: [ 40 ],
            action: function(player, media) {
                player.container.find(".apbp-volume-slider").css("display", "block");
                if (player.hidableControls) {
                    player.showControls();
                    player.startControlsTimer();
                }
                var newVolume = Math.max(media.volume - .1, 0);
                media.setVolume(newVolume);
            }
        }, {
            keys: [ 37, 227 ],
            action: function(player, media) {
                if (!isNaN(media.duration) && media.duration > 0) {
                    if (player.hidableControls) {
                        player.showControls();
                        player.startControlsTimer();
                    }
                    var newTime = Math.max(media.currentTime - player.options.defaultSeekBackwardInterval(media), 0);
                    media.setCurrentTime(newTime);
                }
            }
        }, {
            keys: [ 39, 228 ],
            action: function(player, media) {
                if (!isNaN(media.duration) && media.duration > 0) {
                    if (player.hidableControls) {
                        player.showControls();
                        player.startControlsTimer();
                    }
                    var newTime = Math.min(media.currentTime + player.options.defaultSeekForwardInterval(media), media.duration);
                    media.setCurrentTime(newTime);
                }
            }
        }, {
            keys: [ 70 ],
            action: function(player, media) {
                if (typeof player.enterFullScreen != "undefined") {
                    if (player.isFullScreen) {
                        player.exitFullScreen();
                    } else {
                        player.enterFullScreen();
                    }
                }
            }
        }, {
            keys: [ 77 ],
            action: function(player, media) {
                player.container.find(".apbp-volume-slider").css("display", "block");
                if (player.hidableControls) {
                    player.showControls();
                    player.startControlsTimer();
                }
                if (player.media.muted) {
                    player.setMuted(false);
                } else {
                    player.setMuted(true);
                }
            }
        } ]
    };
    apbp.playerIndex = 0;
    apbp.players = {};
    apbp.audioPicturebookPlayer = function(node, o) {
        if (!(this instanceof apbp.audioPicturebookPlayer)) {
            return new apbp.audioPicturebookPlayer(node, o);
        }
        var t = this;
        t.$media = t.$node = $(node);
        t.node = t.media = t.$media[0];
        if (!t.node) {
            return;
        }
        if (typeof t.node.player != "undefined") {
            return t.node.player;
        }
        if (typeof o == "undefined") {
            o = t.$node.data("mejsoptions");
        }
        t.options = $.extend({}, apbp.apbpDefaults, o);
        if (!t.options.timeFormat) {
            t.options.timeFormat = "mm:ss";
            if (t.options.alwaysShowHours) {
                t.options.timeFormat = "hh:mm:ss";
            }
            if (t.options.showTimecodeFrameCount) {
                t.options.timeFormat += ":ff";
            }
        }
        mejs.Utility.calculateTimeFormat(0, t.options, t.options.framesPerSecond || 25);
        t.id = "apbp_" + apbp.playerIndex++;
        apbp.players[t.id] = t;
        t.init();
        return t;
    };
    apbp.audioPicturebookPlayer.prototype = {
        hasFocus: false,
        controlsAreVisible: true,
        init: function() {
            var t = this, mf = mejs.MediaFeatures;
            meOptions = $.extend(true, {}, t.options, {
                success: function(media, domNode) {
                    t.apbpReady(media, domNode);
                },
                error: function(e) {
                    t.handleError(e);
                }
            }), tagName = t.media.tagName.toLowerCase();
            t.isVideo = false;
            t.$media.removeAttr("controls");
            var videoPlayerTitle = mejs.i18n.t("Audio Player");
            $('<span class="apbp-offscreen">' + videoPlayerTitle + "</span>").insertBefore(t.$media);
            t.container = $('<div id="' + t.id + '" class="apbp-container ' + (mejs.MediaFeatures.svgAsImg ? "svg" : "no-svg") + '" tabindex="0" role="application" aria-label="' + videoPlayerTitle + '">' + '<div class="apbp-clear"></div>' + '<div class="apbp-inner">' + '<div class="apbp-mediaelement"></div>' + '<div class="apbp-layers">' + '<div class="apbp-poster apbp-layer"></div>' + '<div class="apbp-images apbp-layer"></div>' + '<div class="apbp-control-overlay apbp-layer"></div>' + "</div>" + '<div class="apbp-controls"></div>' + "</div>" + "</div>").addClass(t.$media[0].className).insertBefore(t.$media).focus(function(e) {
                if (!t.controlsAreVisible) {
                    t.showControls(true);
                    var playButton = t.container.find(".apbp-playpause-button > button");
                    playButton.focus();
                }
            });
            t.container.addClass((mf.isAndroid ? "apbp-android " : "") + (mf.isiOS ? "apbp-ios " : "") + (mf.isiPad ? "apbp-ipad " : "") + (mf.isiPhone ? "apbp-iphone " : ""));
            if (mf.isiOS) {
                var $newMedia = t.$media.clone();
                t.container.find(".apbp-mediaelement").append($newMedia);
                t.$media.remove();
                t.$node = t.$media = $newMedia;
                t.node = t.media = $newMedia[0];
            } else {
                t.container.find(".apbp-mediaelement").append(t.$media);
            }
            t.node.player = t;
            t.controls = t.container.find(".apbp-controls");
            t.layers = t.container.find(".apbp-layers");
            t.calculatePlayerHeight(t.layers);
            addEvent("resize", window, function() {
                t.calculatePlayerHeight(t.layers);
            }, true);
            if (t.options.features.includes("progress")) {
                t.controls.append('<div class="apbp-progress">' + '<div class="apbp-progress-loaded" />' + '<div class="apbp-progress-current" />' + "</div>");
            }
            var allButtons = $('<div class="apbp-control-buttons" />');
            t.controls.append(allButtons);
            this.buildprevtrack(this, allButtons, this.layers, this.media);
            this.buildplaypause(this.player, allButtons, this.layers, this.media);
            this.buildnexttrack(this, allButtons, this.layers, this.media);
            allButtons.append('<span class="apbp-controls-timestamp"><span class="apbp-timestamp-current">00:00</span> / <span class="apbp-timestamp-total"></span></span>');
            allButtons.append('<span class="apbp-controls-spacer"></span>');
            t.buildvolume(t, allButtons, t.layers, t.$media[0]);
            this.buildaudiofullscreen(this, allButtons, this.layers, this.media);
            t.genPlaylist(t, allButtons, t.layers, t.$media[0]);
            t.loaded = t.controls.find(".apbp-progress-loaded");
            t.total = t.controls.find(".apbp-progress-current");
            meOptions.pluginWidth = t.width;
            meOptions.pluginHeight = t.height;
            mejs.MediaElement(t.$media[0], meOptions);
            t.media.addEventListener("progress", function(e) {
                this.player.updateCurrent();
                this.player.updateTotal();
            }, false);
            t.media.addEventListener("timeupdate", function(e) {
                this.player.updateSlides(t.media, t.layers.find(".apbp-images"), e.currentTime);
            }, false);
        },
        calculatePlayerHeight: function(player) {
            var ratio = this.options.aspectRatio.split(":");
            var ratioMultiplier = ratio[1] / ratio[0];
            player.height(player.width() * ratioMultiplier);
        },
        setPlayerHeight: function(player, height) {
            if (!this.options.setDimensions) {
                return false;
            }
            if (typeof height != "undefined") {
                player.height = height;
            }
        },
        buildvolume: function(player, controls, layers, media) {
            if ((mejs.MediaFeatures.isAndroid || mejs.MediaFeatures.isiOS) && this.options.hideVolumeOnTouchDevices) return;
            var t = this, mode = t.options.audioVolume, mute = mode == "horizontal" ? $('<span class="apbp-button apbp-volume-button apbp-mute">' + '<button type="button" aria-controls="' + t.id + '" title="' + t.options.muteText + '" aria-label="' + t.options.muteText + '"><i class="fa fa-inverse"></i></button>' + "</span>" + '<span class="apbp-horizontal-volume-slider" tabindex="0">' + '<span class="apbp-offscreen">' + t.options.allyVolumeControlText + "</span>" + '<div class="apbp-horizontal-volume-total"></div>' + '<div class="apbp-horizontal-volume-current"></div>' + '<div class="apbp-horizontal-volume-handle"></div>' + "</span>").appendTo(controls) : $('<span class="apbp-button apbp-volume-button apbp-mute">' + '<button type="button" aria-controls="' + t.id + '" title="' + t.options.muteText + '" aria-label="' + t.options.muteText + '"></button>' + '<span class="apbp-volume-slider" tabindex="0">' + '<span class="apbp-offscreen">' + t.options.allyVolumeControlText + "</span>" + '<div class="apbp-volume-total"></div>' + '<div class="apbp-volume-current"></div>' + '<div class="apbp-volume-handle"></div>' + "</span>" + "</span>").appendTo(controls), volumeSlider = t.container.find(".apbp-volume-slider, .apbp-horizontal-volume-slider"), volumeTotal = t.container.find(".apbp-volume-total, .apbp-horizontal-volume-total"), volumeCurrent = t.container.find(".apbp-volume-current, .apbp-horizontal-volume-current"), volumeHandle = t.container.find(".apbp-volume-handle, .apbp-horizontal-volume-handle"), positionVolumeHandle = function(volume, secondTry) {
                if (!volumeSlider.is(":visible") && typeof secondTry == "undefined") {
                    volumeSlider.show();
                    positionVolumeHandle(volume, true);
                    volumeSlider.hide();
                    return;
                }
                volume = Math.max(0, volume);
                volume = Math.min(volume, 1);
                if (volume === 0) {
                    mute.removeClass("apbp-mute").addClass("apbp-unmute");
                    mute.children("button").attr("title", mejs.i18n.t("Unmute")).attr("aria-label", mejs.i18n.t("Unmute"));
                } else {
                    mute.removeClass("apbp-unmute").addClass("apbp-mute");
                    mute.children("button").attr("title", mejs.i18n.t("Mute")).attr("aria-label", mejs.i18n.t("Mute"));
                }
                var totalPosition = volumeTotal.position();
                if (mode == "vertical") {
                    var totalHeight = volumeTotal.height(), newTop = totalHeight - totalHeight * volume;
                    volumeHandle.css("top", Math.round(totalPosition.top + newTop - volumeHandle.height() / 2));
                    volumeCurrent.height(totalHeight - newTop);
                    volumeCurrent.css("top", totalPosition.top + newTop);
                } else {
                    var totalWidth = volumeTotal.width(), newLeft = totalWidth * volume;
                    volumeHandle.css("left", Math.round(totalPosition.left + newLeft - volumeHandle.width() / 2));
                    volumeCurrent.width(Math.round(newLeft));
                }
            }, handleVolumeMove = function(e) {
                var volume = null, totalOffset = volumeTotal.offset();
                if (mode === "vertical") {
                    var railHeight = volumeTotal.height(), newY = e.pageY - totalOffset.top;
                    volume = (railHeight - newY) / railHeight;
                    if (totalOffset.top === 0 || totalOffset.left === 0) {
                        return;
                    }
                } else {
                    var railWidth = volumeTotal.width(), newX = e.pageX - totalOffset.left;
                    volume = newX / railWidth;
                }
                volume = Math.max(0, volume);
                volume = Math.min(volume, 1);
                positionVolumeHandle(volume);
                if (volume === 0) {
                    media.setMuted(true);
                } else {
                    media.setMuted(false);
                }
                media.setVolume(volume);
            }, mouseIsDown = false, mouseIsOver = false;
            mute.hover(function() {
                volumeSlider.show();
                mouseIsOver = true;
            }, function() {
                mouseIsOver = false;
                if (!mouseIsDown && mode == "vertical") {
                    volumeSlider.hide();
                }
            });
            var updateVolumeSlider = function(e) {
                var volume = Math.floor(media.volume * 100);
                volumeSlider.attr({
                    "aria-label": mejs.i18n.t("volumeSlider"),
                    "aria-valuemin": 0,
                    "aria-valuemax": 100,
                    "aria-valuenow": volume,
                    "aria-valuetext": volume + "%",
                    role: "slider",
                    tabindex: 0
                });
            };
            volumeSlider.bind("mouseover", function() {
                mouseIsOver = true;
            }).bind("mousedown", function(e) {
                handleVolumeMove(e);
                t.globalBind("mousemove.vol", function(e) {
                    handleVolumeMove(e);
                });
                t.globalBind("mouseup.vol", function() {
                    mouseIsDown = false;
                    t.globalUnbind(".vol");
                    if (!mouseIsOver && mode == "vertical") {
                        volumeSlider.hide();
                    }
                });
                mouseIsDown = true;
                return false;
            }).bind("keydown", function(e) {
                var keyCode = e.keyCode;
                var volume = media.volume;
                switch (keyCode) {
                  case 38:
                    volume += .1;
                    break;

                  case 40:
                    volume = volume - .1;
                    break;

                  default:
                    return true;
                }
                mouseIsDown = false;
                positionVolumeHandle(volume);
                media.setVolume(volume);
                return false;
            }).bind("blur", function() {
                volumeSlider.hide();
            });
            mute.find("button").click(function() {
                media.setMuted(!media.muted);
            });
            mute.find("button").bind("focus", function() {
                volumeSlider.show();
            });
            media.addEventListener("volumechange", function(e) {
                if (!mouseIsDown) {
                    if (media.muted) {
                        positionVolumeHandle(0);
                        mute.removeClass("apbp-mute").addClass("apbp-unmute");
                    } else {
                        positionVolumeHandle(media.volume);
                        mute.removeClass("apbp-unmute").addClass("apbp-mute");
                    }
                }
                updateVolumeSlider(e);
            }, false);
            if (player.options.startVolume === 0) {
                media.setMuted(true);
            }
            if (media.pluginType === "native") {
                media.setVolume(player.options.startVolume);
            }
            t.container.on("controlsresize", function() {
                positionVolumeHandle(media.volume);
            });
        },
        changePoster: function(posterUrl) {
            var t = this;
            t.layers.find(".apbp-poster").css("background-image", 'url("' + posterUrl + '")');
            t.layers.find(".apbp-poster").show();
        },
        changeSlides: function(slideUrl, slideInline, slideLang, poster) {
            this.layers.find(".apbp-images").empty();
            if (slideInline) {
                var slidesList = [];
                for (var key in slideInline) {
                    var slideArr = slideInline[key];
                    if (slideArr.length == 2) {
                        var seconds = $.trim(mejs.Utility.convertSMPTEtoSeconds(slideArr[0]));
                        if (!seconds) {
                            continue;
                        }
                        slidesList[slidesList.length] = $('<div class="apbp-slide-image" style="background-image: url(\'' + slideArr[1] + '\');" data-start="' + seconds + '" />');
                    }
                }
                this.layers.find(".apbp-images").append(slidesList);
            }
        },
        updateCurrent: function() {
            if (this.media.duration > 0 && this.media.currentTime >= 0) {
                this.controls.find(".apbp-timestamp-current").text(mejs.Utility.secondsToTimeCode(this.media.currentTime, this.options));
                var percentCompleted = this.media.currentTime / this.media.duration * 100;
                var percentLoaded = this.getLoadedPercent();
                this.controls.find(".apbp-progress-current").css("width", percentCompleted + "%");
                this.controls.find(".apbp-progress-loaded").css("width", percentLoaded + "%");
            }
        },
        updateSlides: function(media, slides, current) {
            var currentTime = media.currentTime;
            if (currentTime > .1) {
                slides.addClass("apbp-blackout");
            } else {
                slides.removeClass("apbp-blackout");
            }
            var allChildren = slides.children();
            allChildren.css("opacity", 0);
            var previousChildren = allChildren.filter(function(i, e) {
                return $(e).data("start") <= media.currentTime && currentTime > 0;
            });
            $(previousChildren[previousChildren.length - 1]).css("opacity", 1);
        },
        getLoadedPercent: function(e) {
            var t = this, target = e !== undefined ? e.target : t.media, percent = null;
            if (target && target.buffered && target.buffered.length > 0 && target.buffered.end && target.duration) {
                percent = target.buffered.end(target.buffered.length - 1) / target.duration;
            } else if (target && target.bytesTotal !== undefined && target.bytesTotal > 0 && target.bufferedBytes !== undefined) {
                percent = target.bufferedBytes / target.bytesTotal;
            } else if (e && e.lengthComputable && e.total !== 0) {
                percent = e.loaded / e.total;
            }
            return percent * 100;
        },
        updateTotal: function() {
            if (this.media.duration >= 0) {
                this.controls.find(".apbp-timestamp-total").text(mejs.Utility.secondsToTimeCode(this.media.duration, this.options));
            }
        },
        buildplaylist: function(player, controls, layers, media) {
            var t = this;
            var playlistToggle = $('<div class="apbp-button apbp-playlist-plugin-button apbp-playlist-button ' + (player.options.playlist ? "apbp-hide-playlist" : "apbp-show-playlist") + '">' + '<button type="button" aria-controls="' + player.id + '" title="' + player.options.playlistText + '"><i class="fa fa-inverse fa-list"></i></button>' + "</div>");
            playlistToggle.appendTo(controls).click(function() {
                t.togglePlaylistDisplay(player, layers, media);
            });
            t.playlistToggle = t.controls.find(".apbp-playlist-button");
        },
        togglePlaylistDisplay: function(player, layers, media, showHide) {
            var t = this;
            if (!!showHide) {
                player.options.playlist = showHide === "show" ? true : false;
            } else {
                player.options.playlist = !player.options.playlist;
            }
            $(media).trigger("mep-playlisttoggle", [ player.options.playlist ]);
            if (player.options.playlist) {
                layers.children(".apbp-playlist").fadeIn();
                t.playlistToggle.removeClass("apbp-show-playlist").addClass("apbp-hide-playlist");
            } else {
                layers.children(".apbp-playlist").fadeOut();
                t.playlistToggle.removeClass("apbp-hide-playlist").addClass("apbp-show-playlist");
            }
        },
        genPlaylist: function(player, controls, layers, media) {
            var t = this, playlist = $('<div class="apbp-playlist apbp-layer">' + '<ul class="apbp"></ul>' + "</div>").appendTo(layers);
            if (!!$(media).data("showplaylist")) {
                player.options.playlist = true;
                $("#" + player.id).find(".apbp-overlay-play").hide();
            }
            if (!player.options.playlist) {
                playlist.hide();
            }
            var getTrackName = function(trackUrl) {
                var trackUrlParts = trackUrl.split("/");
                if (trackUrlParts.length > 0) {
                    return decodeURIComponent(trackUrlParts[trackUrlParts.length - 1]);
                } else {
                    return "";
                }
            };
            var tracks = [], sourceIsPlayable, foundMatchingType = "";
            $("#" + player.id).find(".apbp-mediaelement source").each(function() {
                if ($(this).parent()[0] && $(this).parent()[0].canPlayType) {
                    sourceIsPlayable = $(this).parent()[0].canPlayType(this.type);
                } else if ($(this).parent()[0] && $(this).parent()[0].player && $(this).parent()[0].player.media && $(this).parent()[0].player.media.canPlayType) {
                    sourceIsPlayable = $(this).parent()[0].player.media.canPlayType(this.type);
                } else {
                    console.error("Cannot determine if we can play this media (no canPlayType()) on" + $(this).toString());
                }
                if (!foundMatchingType && (sourceIsPlayable === "maybe" || sourceIsPlayable === "probably")) {
                    foundMatchingType = this.type;
                }
                if (!!foundMatchingType && this.type === foundMatchingType) {
                    if ($.trim(this.src) !== "") {
                        var track = {};
                        track.source = $.trim(this.src);
                        if ($.trim(this.title) !== "") {
                            track.name = $.trim(this.title);
                        } else {
                            track.name = getTrackName(track.source);
                        }
                        track.poster = $(this).data("poster");
                        track.slides = $(this).data("slides");
                        track.slidesinline = $(this).data("slides-inline");
                        track.slideslang = $(this).data("slides-lang");
                        tracks.push(track);
                    }
                }
            });
            for (var track in tracks) {
                var $thisLi = $('<li data-url="' + tracks[track].source + '" data-poster="' + tracks[track].poster + (!tracks[track].slides ? "" : '" data-slides="' + tracks[track].slides) + (!tracks[track].slideslang ? "" : '" data-slides-lang="' + tracks[track].slideslang) + '" title="' + tracks[track].name + '"><span>' + tracks[track].name + "</span></li>");
                $thisLi.data("slides-inline", tracks[track].slidesinline);
                layers.find(".apbp-playlist > ul").append($thisLi);
                if ($(player.media).hasClass("mep-slider")) {
                    $thisLi.css({
                        "background-image": 'url("' + $thisLi.data("poster") + '")'
                    });
                }
            }
            player.videoSliderTracks = tracks.length;
            layers.find("li:first").addClass("current played");
            if (!player.isVideo) {
                var firstTrack = layers.find("li:first").first();
                player.changePoster(firstTrack.data("poster"));
                player.changeSlides(firstTrack.data("slides"), firstTrack.data("slides-inline"), firstTrack.data("slides-lang"), firstTrack.data("poster"));
            }
            var $prevVid = $('<a class="mep-prev">'), $nextVid = $('<a class="mep-next">');
            player.videoSliderIndex = 0;
            layers.find(".apbp-playlist").append($prevVid);
            layers.find(".apbp-playlist").append($nextVid);
            $("#" + player.id + ".apbp-container.mep-slider").find(".apbp-playlist ul li").css({
                transform: "translate3d(0, -20px, 0) scale3d(0.75, 0.75, 1)"
            });
            $prevVid.click(function() {
                var moveMe = true;
                player.videoSliderIndex -= 1;
                if (player.videoSliderIndex < 0) {
                    player.videoSliderIndex = 0;
                    moveMe = false;
                }
                if (player.videoSliderIndex === player.videoSliderTracks - 1) {
                    $nextVid.fadeOut();
                } else {
                    $nextVid.fadeIn();
                }
                if (player.videoSliderIndex === 0) {
                    $prevVid.fadeOut();
                } else {
                    $prevVid.fadeIn();
                }
                if (moveMe === true) {
                    player.sliderWidth = $("#" + player.id).width();
                    $("#" + player.id + ".apbp-container.mep-slider").find(".apbp-playlist ul li").css({
                        transform: "translate3d(-" + Math.ceil(player.sliderWidth * player.videoSliderIndex) + "px, -20px, 0) scale3d(0.75, 0.75, 1)"
                    });
                }
            }).hide();
            $nextVid.click(function() {
                var moveMe = true;
                player.videoSliderIndex += 1;
                if (player.videoSliderIndex > player.videoSliderTracks - 1) {
                    player.videoSliderIndex = player.videoSliderTracks - 1;
                    moveMe = false;
                }
                if (player.videoSliderIndex === player.videoSliderTracks - 1) {
                    $nextVid.fadeOut();
                } else {
                    $nextVid.fadeIn();
                }
                if (player.videoSliderIndex === 0) {
                    $prevVid.fadeOut();
                } else {
                    $prevVid.fadeIn();
                }
                if (moveMe === true) {
                    player.sliderWidth = $("#" + player.id).width();
                    $("#" + player.id + ".apbp-container.mep-slider").find(".apbp-playlist ul li").css({
                        transform: "translate3d(-" + Math.ceil(player.sliderWidth * player.videoSliderIndex) + "px, -20px, 0) scale3d(0.75, 0.75, 1)"
                    });
                }
            });
            layers.find(".apbp-playlist > ul li").click(function() {
                if (!$(this).hasClass("current")) {
                    $(this).addClass("played");
                    player.playTrack($(this));
                } else {
                    if (!player.media.paused) {
                        player.pause();
                    } else {
                        player.play();
                    }
                }
            });
            media.addEventListener("ended", function() {
                player.playNextTrack();
            }, false);
            media.addEventListener("playing", function() {
                player.container.removeClass("mep-paused").addClass("mep-playing");
                if (player.isVideo) {
                    t.togglePlaylistDisplay(player, layers, media, "hide");
                }
            }, false);
            media.addEventListener("play", function() {
                if (!player.isVideo) {
                    layers.find(".apbp-poster").show();
                }
            }, false);
            media.addEventListener("pause", function() {
                player.container.removeClass("mep-playing").addClass("mep-paused");
            }, false);
        },
        buildplaypause: function(player, controls, layers, media) {
            var t = this, op = t.options, play = $('<span class="apbp-button apbp-playpause apbp-playpause-play" >' + '<button type="button" aria-controls="' + t.id + '" title="' + op.playText + '" aria-label="' + op.playText + '">' + '<i class="fa fa-inverse"></i>' + "</button>" + "</span>").appendTo(controls).click(function(e) {
                e.preventDefault();
                if (media.paused) {
                    media.play();
                } else {
                    media.pause();
                }
                return false;
            }), play_btn = play.find("button");
            function togglePlayPause(which) {
                if ("play" === which) {
                    play.removeClass("apbp-playpause-play").addClass("apbp-playpause-pause");
                    play_btn.attr({
                        title: op.pauseText,
                        "aria-label": op.pauseText
                    });
                } else {
                    play.removeClass("apbp-playpause-pause").addClass("apbp-playpause-play");
                    play_btn.attr({
                        title: op.playText,
                        "aria-label": op.playText
                    });
                }
            }
            togglePlayPause("pse");
            media.addEventListener("play", function() {
                togglePlayPause("play");
            }, false);
            media.addEventListener("playing", function() {
                togglePlayPause("play");
            }, false);
            media.addEventListener("pause", function() {
                togglePlayPause("pse");
            }, false);
            media.addEventListener("paused", function() {
                togglePlayPause("pse");
            }, false);
        },
        buildprevtrack: function(player, controls, layers, media) {
            var t = this;
            var prevTrack = $('<span class="apbp-button apbp-previous">' + '<button type="button" aria-controls="' + player.id + '" title="' + player.options.prevText + '"><i class="fa fa-inverse fa-step-backward"></i></button>' + "</span>");
            prevTrack.appendTo(controls).click(function() {
                $(media).trigger("apbp-playprevtrack");
                player.playPrevTrack();
            });
            t.prevTrack = t.controls.find(".apbp-prevtrack-button");
        },
        prevTrackClick: function() {
            var t = this;
            t.prevTrack.trigger("click");
        },
        buildnexttrack: function(player, controls, layers, media) {
            var t = this;
            var nextTrack = $('<div class="apbp-button apbp-next">' + '<button type="button" aria-controls="' + player.id + '" title="' + player.options.nextText + '"><i class="fa fa-inverse fa-step-forward"></i></button>' + "</div>");
            nextTrack.appendTo(controls).click(function() {
                $(media).trigger("apbp-playnexttrack");
                player.playNextTrack();
            });
            t.nextTrack = t.controls.find(".apbp-nexttrack-button");
        },
        nextTrackClick: function() {
            var t = this;
            t.nextTrack.trigger("click");
        },
        playNextTrack: function() {
            var t = this, nxt;
            var tracks = t.layers.find(".apbp-playlist > ul > li");
            var current = tracks.filter(".current");
            var notplayed = tracks.not(".played");
            if (notplayed.length < 1) {
                current.removeClass("played").siblings().removeClass("played");
                notplayed = tracks.not(".current");
            }
            var atEnd = false;
            if (t.options.shuffle) {
                var random = Math.floor(Math.random() * notplayed.length);
                nxt = notplayed.eq(random);
            } else {
                nxt = current.next();
                if (nxt.length < 1 && t.options.autoRewind) {
                    nxt = current.siblings().first();
                    atEnd = true;
                }
            }
            t.options.loop = false;
            if (nxt.length == 1) {
                nxt.addClass("played");
                t.playTrack(nxt);
            }
        },
        playPrevTrack: function() {
            var t = this, prev;
            var tracks = t.layers.find(".apbp-playlist > ul > li");
            var current = tracks.filter(".current");
            var played = tracks.filter(".played").not(".current");
            if (played.length < 1) {
                current.removeClass("played");
                played = tracks.not(".current");
            }
            if (t.options.shuffle) {
                var random = Math.floor(Math.random() * played.length);
                prev = played.eq(random);
            } else {
                prev = current.prev();
                if (prev.length < 1) {
                    prev = current.siblings().last();
                }
            }
            if (prev.length == 1) {
                current.removeClass("played");
                this.playTrack(prev);
            }
            t.setControlsSize();
        },
        playTrack: function(track) {
            var t = this;
            try {
                t.media.pause();
            } catch (e) {}
            t.media.setSrc(track.data("url"));
            if (!t.media.isLoaded) {
                t.media.load();
            }
            t.changePoster(track.data("poster"));
            t.changeSlides(track.data("slides"), track.data("slides-inline"), track.data("slides-lang"), track.data("poster"));
            t.media.play();
            track.addClass("current").siblings().removeClass("current");
        },
        apbpReady: function(media, domNode) {
            var t = this, mf = mejs.MediaFeatures, autoplayAttr = domNode.getAttribute("autoplay"), autoplay = !(typeof autoplayAttr == "undefined" || autoplayAttr === null || autoplayAttr === "false"), featureIndex, feature;
            if (t.created) {
                return;
            } else {
                t.created = true;
            }
            t.media = media;
            t.domNode = domNode;
            t.updateCurrent();
            t.updateTotal();
            t.updateSlides(t.media, t.layers.find(".apbp-images"), 0);
            t.media.addEventListener("loadedmetadata", function(e) {
                if (t.updateCurrent) {
                    t.updateCurrent();
                }
                if (t.updateTotal) {
                    t.updateTotal();
                }
                this.player.updateSlides(t.media, t.layers.find(".apbp-images"), e.currentTime);
            }, false);
            t.media.addEventListener("loadeddata", function(e) {
                if (t.updateCurrent) {
                    t.updateCurrent();
                }
                if (t.updateTotal) {
                    t.updateTotal();
                }
            }, false);
            var duration = null;
            t.media.addEventListener("timeupdate", function() {
                if (duration !== this.duration) {
                    this.player.updateCurrent();
                }
            }, false);
        },
        buildaudiofullscreen: function(player, controls, layers, media) {
            var t = this;
            if (screenfull.enabled) ;
            if (mejs.MediaFeatures.hasTrueNativeFullScreen) {
                var func = function(e) {
                    if (player.isFullScreen) {
                        if (mejs.MediaFeatures.isFullScreen()) {
                            player.isNativeFullScreen = true;
                            player.setControlsSize();
                        } else {
                            player.isNativeFullScreen = false;
                            player.exitFullScreen();
                        }
                    }
                };
                player.globalBind(mejs.MediaFeatures.fullScreenEventName, func);
            }
            t.fullscreenBtn = $('<div class="apbp-button apbp-fullscreen-expandcontract">' + '<button type="button" aria-controls="' + t.id + '" title="' + t.options.fullscreenText + '" aria-label="' + t.options.fullscreenText + '"><i class="fa fa-inverse"></i></button>' + "</div>");
            t.fullscreenBtn.appendTo(controls);
            t.fullscreenBtn.on("click", function(e) {
                if (player.isFullScreen) {
                    if (screenfull.enabled) {
                        screenfull.exit();
                    } else {
                        player.removeClass("apbp-fakefullscreen");
                    }
                    player.removeClass("apbp-fullscreen");
                    player.isFullScreen = false;
                } else {
                    if (screenfull.enabled) {
                        screenfull.request(player.container[0]);
                    } else {
                        player.addClass("apbp-fakefullscreen");
                    }
                    player.addClass("apbp-fullscreen");
                    player.isFullScreen = true;
                }
            });
        }
    };
    (function() {
        var rwindow = /^((after|before)print|(before)?unload|hashchange|message|o(ff|n)line|page(hide|show)|popstate|resize|storage)\b/;
        function splitEvents(events, id) {
            var ret = {
                d: [],
                w: []
            };
            $.each((events || "").split(" "), function(k, v) {
                var eventname = v + "." + id;
                if (eventname.indexOf(".") === 0) {
                    ret.d.push(eventname);
                    ret.w.push(eventname);
                } else {
                    ret[rwindow.test(v) ? "w" : "d"].push(eventname);
                }
            });
            ret.d = ret.d.join(" ");
            ret.w = ret.w.join(" ");
            return ret;
        }
        apbp.audioPicturebookPlayer.prototype.globalBind = function(events, data, callback) {
            var t = this;
            events = splitEvents(events, t.id);
            if (events.d) $(document).bind(events.d, data, callback);
            if (events.w) $(window).bind(events.w, data, callback);
        };
        apbp.audioPicturebookPlayer.prototype.globalUnbind = function(events, callback) {
            var t = this;
            events = splitEvents(events, t.id);
            if (events.d) $(document).unbind(events.d, callback);
            if (events.w) $(window).unbind(events.w, callback);
        };
    })();
    if (typeof $ != "undefined") {
        $.fn.audiopicturebookplayer = function(options) {
            if (options === false) {
                this.each(function() {
                    var player = $(this).data("audiopicturebookplayer");
                    if (player) {
                        player.remove();
                    }
                    $(this).removeData("audiopicturebookplayer");
                });
            } else {
                this.each(function() {
                    $(this).data("audiopicturebookplayer", new apbp.audioPicturebookPlayer(this, options));
                });
            }
            return this;
        };
        $(document).ready(function() {
            $(".apbp-player").audiopicturebookplayer();
        });
    }
    window.MediaElementPlayer = mejs.MediaElementPlayer;
})(jQuery);