import './icons.js'
import Swiper from './swiper.js'
// const $ = selector => document.querySelector(selector)
// const $$ = selector => document.querySelectorAll(selector)

class player {
    constructor(node) {
        this.root = typeof node === 'string' ? document.querySelector(node) : node
        this.$ = selector => this.root.querySelector(selector)
        this.$$ = selector => this.root.querySelectorAll(selector)
        this.songList = []
        this.currentIndex = 0
        this.audio = new Audio()
        this.lyricsArr = []
        this.lyricIndex = -1
        this.start()
        this.bind()
    }

    start() {
        fetch('https://sherltiangang.github.io/music-list/Huawei-music/music-list.json')
            .then(response => response.json())
            .then(data => {
                console.log(data)
                this.songList = data
                this.renderSong()
            })
    }

    bind() {
        let self = this;
        this.$('.btn-pause').onclick = function () {
            if (this.classList.contains('playing')) {
                self.audio.pause()
                this.classList.remove('playing')
                this.classList.add('pause')
                this.querySelector('use').setAttribute('xlink:href', '#icon-play')
            } else if (this.classList.contains('pause')) {
                self.audio.play()
                this.classList.remove('pause')
                this.classList.add('playing')
                this.querySelector('use').setAttribute('xlink:href', '#icon-pause')
            }
            // self.playSong()
            console.log(self.audio)
        }
        this.$('.btn-pre').onclick = function () {
            self.$('.btn-pause>use').setAttribute('xlink:href', '#icon-pause')
            self.currentIndex = (self.songList.length + self.currentIndex - 1) % self.songList.length
            self.renderSong()
            self.playSong()
        }
        this.$('.btn-next').onclick = function () {
            self.$('.btn-pause>use').setAttribute('xlink:href', '#icon-pause')
            self.currentIndex = (self.currentIndex + 1) % self.songList.length
            self.renderSong()
            self.playSong()
        }
        this.$('.bar').onclick = function(e) {
            var percent = e.offsetX / parseInt(getComputedStyle(this).width)
            self.audio.currentTime = self.audio.duration * percent
        }
        this.$('.btn-circle').onclick = function() {
            if (this.classList.contains('no-circle')) {
                self.audio.loop = true
                this.classList.remove('no-circle')
                this.classList.add('is-circle')
            } else if (this.classList.contains('is-circle')) {
                self.audio.loop = false
                this.classList.remove('is-circle')
                this.classList.remove('no-circle')
            }
        console.log('loop')
            // self.loopSong()
        }
        this.audio.ontimeupdate = function () {
            console.log(parseInt(self.audio.currentTime * 1000))
            self.locateLyric()
            self.setProgerssBar()
        }
        this.audio.onended = function(){
            self.$('.btn-pause>use').setAttribute('xlink:href', '#icon-pause')
            self.currentIndex = (self.currentIndex + 1) % self.songList.length
            self.renderSong()
            self.playSong()
        }
        let swiper = new Swiper(this.$('.container'))
        swiper.on('swipLeft', function () {
            console.log(this)
            this.classList.remove('panel1')
            this.classList.add('panel2')
            self.$('.ball-left').classList.remove('current')
            self.$('.ball-right').classList.add('current')
        })
        swiper.on('swipRight', function () {
            console.log(this)
            this.classList.remove('panel2')
            this.classList.add('panel1')
            self.$('.ball-right').classList.remove('current')
            self.$('.ball-left').classList.add('current')
        })
    }
    renderSong() {
        let songObj = this.songList[this.currentIndex]
        this.$('.header h1').innerText = songObj.title
        this.$('.header p').innerText = songObj.author + '-' + songObj.albumn
        this.audio.src = songObj.url
        this.audio.onloadedmetadata = () => this.$('.time-end').innerText = this.formateTime(this.audio.duration)

        this.loadLyrics()
    }
    playSong() {
        this.audio.oncanplaythrough = () => this.audio.play()
    }
    // playPrevSong() {
    //     this.currentIndex = (this.songList.length + this.currentIndex - 1) % this.songList.length
    //     this.audio.src = this.songList[this.currentIndex].url
    //     this.renderSong()
    //     this.audio.oncanplaythrough = () => this.audio.play()
    // }
    // playNextSong() {
    //     this.currentIndex = (this.currentIndex + 1) % this.songList.length
    //     this.audio.src = this.songList[this.currentIndex].url
    //     this.renderSong()
    //     this.audio.oncanplaythrough = () => this.audio.play()
    // }
    // loopSong() {
    //     this.audio.loop = true
    // }
    loadLyrics() {
        fetch(this.songList[this.currentIndex].lyric)
            .then(response => response.json())
            .then(data => {
                console.log(data.lrc.lyric)
                this.setLyrics(data.lrc.lyric)
                window.lyrics = data.lrc.lyric
            })
    }
    locateLyric() {
        console.log('locateLyric')
        let currentTime = this.audio.currentTime * 1000
        let nextLineTime = this.lyricsArr[this.lyricIndex + 1][0];
        if (currentTime > nextLineTime && this.lyricIndex < this.lyricsArr.length - 2) {
            this.lyricIndex++
            let node = this.$('[data-time="' + this.lyricsArr[this.lyricIndex][0] + '"]')
            if (node) this.setLineToCenter(node)
            this.$$('.panel-effect .lyrics p')[0].innerText = this.lyricsArr[this.lyricIndex][1]
            this.$$('.panel-effect .lyrics p')[1].innerText = this.lyricsArr[this.lyricIndex + 1] ? this.lyricsArr[this.lyricIndex + 1][1] : ''

        }
    }
    setLineToCenter(node) {
        let offset = node.offsetTop - this.$('.panel-lyrics').offsetHeight / 2
        offset = offset > 0 ? offset : 0
        this.$('.panel-lyrics .lyrics-box').style.transform = `translateY(-${offset}px)`
        this.$$('.panel-lyrics p').forEach(node => node.classList.remove('current'))
        node.classList.add('current')
    }
    setLyrics(lyrics) {
        this.lyricIndex = 0
        let fragment = document.createDocumentFragment()
        let lyricsArr = []
        this.lyricsArr = lyricsArr
        lyrics.split(/\n/)
            .filter(str => str.match(/\[.+?\]/))
            .forEach(line => {
                let str = line.replace(/\[.+?\]/g, '')
                line.match(/\[.+?\]/g).forEach(t => {
                    t = t.replace(/[\[\]]/g, '')
                    let milliseconds = parseInt(t.slice(0, 2)) * 60 * 1000 + parseInt(t.slice(3, 5)) * 1000 + parseInt(t.slice(6))
                    lyricsArr.push([milliseconds, str])
                })
            })

        lyricsArr.filter(line => line[1].trim() !== '').sort((v1, v2) => {
            if (v1[0] > v2[0]) {
                return 1
            } else {
                return -1
            }
        }).forEach(line => {
            let node = document.createElement('p')
            node.setAttribute('data-time', line[0])
            node.innerText = line[1]
            fragment.appendChild(node)
        })
        this.$('.container .lyrics-box').innerHTML = ''
        this.$('.container .lyrics-box').appendChild(fragment)
    }
    formateTime(secondsTotal) {
        let minutes = parseInt(secondsTotal / 60)
        minutes = minutes >= 10 ? '' + minutes : '0' + minutes
        let seconds = parseInt(secondsTotal % 60)
        seconds = seconds >= 10 ? '' + seconds : '0' + seconds
        return minutes + ':' + seconds
    }
    setProgerssBar() {
        console.log('set setProgerssBar')
        let percent = (this.audio.currentTime * 100 / this.audio.duration) + '%'
        console.log(percent)
        this.$('.bar .progress').style.width = percent
        this.$('.time-start').innerText = this.formateTime(this.audio.currentTime)
        console.log(this.$('.bar .progress').style.width)
    }



}

window.a = new player('#player')

