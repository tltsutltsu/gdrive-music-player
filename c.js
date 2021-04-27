/*let links = [{
	link:'https://drive.google.com/drive/folders/15CMixwZ_eV9W5HYoIYZyoEoSslzvsshF?usp=sharing',
	name: 'Первый плейлист'
}, {
	link: 'https://drive.google.com/drive/folders/13xbEMKy7vYtUgkvbUMZn4GWF_umgyHTT?usp=sharing',
	title: 'Второй плейлист'
}];*/
if(!window.playlists) window.playlists = [];

function getFolderId(lnk) {
	const regex = /https:\/\/drive\.google\.com\/drive\/folders\/(.*?)\?usp=sharing/g;
	const matches = regex.exec(lnk);

	return matches[1];
}

function start(id) {
    var node = document.scripts[document.scripts.length - 1];
    node.insertAdjacentHTML('beforebegin', `
            <div id="mainwrap`+id+`" class="mainwrap">
                <div class="audiowrap" id="audiowrap`+id+`">
                    <div id="audio0`+id+`">
                        <audio id="audio1`+id+`" preload controls>Ваш браузер не поддерживает HTML5-аудио 😢</audio>
                    </div>
                </div>
                <div class="plwrap" id="plwrap`+id+`">
                    <ul class="plList" id="plList`+id+`"></ul>
                </div>
            </div>
        `);

    let itemsFetched = 0;
    let links = [window.links[id]];
    for (let i = links.length - 1; i >= 0; i--) {
    	const folderId=getFolderId(links[i].link);

    	const url = 'https://www.googleapis.com/drive/v2/files?q=%27' +
    				folderId +
    				'%27+in+parents&key=AIzaSyBoDxZwg19_iUv1NixN2TVn1uqXC_4ZWII'

    	fetch(url, {
            method: 'get'
        })
        .then(response => response.json())
        .then(jsonData => {
            console.log(jsonData)
        	window.playlists[i] = []
        	jsonData.items.forEach((el, index)=>{
        		const trackNumber = el.title.substr(0, el.title.indexOf('_')) || new Date().getTime().toString().substr(10, 13),
        			  trackNameWithoutExt = el.title.split('.').slice(0, -1).join('.'),
        			  trackName = trackNameWithoutExt.substr(trackNameWithoutExt.indexOf('_')+1, trackNameWithoutExt.length);
        		const song = {
        			file: el.downloadUrl,//'http://docs.google.com/uc?export=open&id='+el.id,
        			name: trackName,
        			track: trackNumber,
        			duration: "13:37"
        		}
        		window.playlists[i][trackNumber-1] = song
        	})

        	window.playlists[i] = window.playlists[i].filter(function (el) {
    			return el != null;
    		});

        	if(++itemsFetched == links.length) init(id);
        })
        .catch(err => {
            console.error('error while fetching songs info from google drive', err)
        });
    }

}

function init(selId) {
    'use strict'
    console.log(selId)
    var supportsAudio = !!document.createElement('audio').canPlayType;
    if (supportsAudio) {
        // initialize plyr
        var player = new Plyr('#audio1'+selId, {
        	controls: [
                //'restart',
                'play',
                'progress',
                'current-time',
                'duration',
                'mute',
                'volume',
                'download'
            ]
        });
        $('#mainwrap'+selId+' [data-plyr="play"]').before('<a id="btnPrev'+selId+'" class="b">&larr;</a>');
        $('#mainwrap'+selId+' [data-plyr="play"]').after('<a id="btnNext'+selId+'" class="b">&rarr;</a>');
        // initialize playlist and controls
        var index = 0,
            playing = false,
            extension = '',
            tracks = window.playlists[0],
            buildPlaylist = $.each(tracks, function(key, value) {
                var trackNumber = key+1,//value.track,
                    trackName = value.name,
                    trackDuration = value.duration;
                if (trackNumber.toString().length === 1) {
                    trackNumber = '0' + trackNumber;
                }
                $('#plList'+selId).append('<li> \
                    <div class="plItem"> \
                        <span class="plNum">' + trackNumber + '.</span> \
                        <span class="plTitle">' + trackName + '</span> \
                        <span class="plLength" style="display:none">' + trackDuration + '</span> \
                    </div> \
                </li>');
            }),
            trackCount = tracks.length,
            npAction = $('#npAction'+selId),
            npTitle = $('#npTitle'+selId),
            audio = $('#audio1'+selId).on('play', function () {
                playing = true;
                npAction.text('Now Playing...');
            }).on('pause', function () {
                playing = false;
                npAction.text('Paused...');
            }).on('ended', function () {
                npAction.text('Paused...');
                if ((index + 1) < trackCount) {
                    index++;
                    loadTrack(index);
                    audio.play();
                } else {
                    audio.pause();
                    index = 0;
                    loadTrack(index);
                }
            }).get(0),
            btnPrev = $('#btnPrev'+selId).on('click', function () {
                if ((index - 1) > -1) {
                    index--;
                    loadTrack(index);
                    if (playing) {
                        audio.play();
                    }
                } else {
                    audio.pause();
                    index = 0;
                    loadTrack(index);
                }
            }),
            btnNext = $('#btnNext'+selId).on('click', function () {
                if ((index + 1) < trackCount) {
                    index++;
                    loadTrack(index);
                    if (playing) {
                        audio.play();
                    }
                } else {
                    audio.pause();
                    index = 0;
                    loadTrack(index);
                }
            }),
            li = $('#plList'+selId+' li').on('click', function () {
                var id = parseInt($(this).index());
                if (id !== index) {
                    playTrack(id);
                }
            }),
            loadTrack = function (id) {
                $('#mainwrap'+selId+' .plSel').removeClass('plSel');
                $('#plList'+selId+' li:eq(' + id + ')').addClass('plSel');
                npTitle.text(tracks[id].name);
                index = id;
                audio.src = tracks[id].file;
                updateDownload(id, audio.src);
            },
            updateDownload = function (id, source) {
                player.on('loadedmetadata', function () {
                    $('#mainwrap'+selId+' a[data-plyr="download"]').attr('href', source);
                    $('#mainwrap'+selId+' a[data-plyr="download"]').attr('data-dur', player.duration);
                });
            },
            playTrack = function (id) {
                loadTrack(id);
                audio.play();
            };
        extension = audio.canPlayType('audio/mpeg') ? '.mp3' : audio.canPlayType('audio/ogg') ? '.ogg' : '';
        loadTrack(index);
    } else {
        // no audio support
        $('.column').addClass('hidden');
        var noSupport = $('#audio1'+selId).text();
        $('.container').append('<p class="no-support">' + noSupport + '</p>');
    }
};
