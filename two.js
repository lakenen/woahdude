navigator.getUserMedia = navigator.getUserMedia
  || navigator.webkitGetUserMedia
  || navigator.mozGetUserMedia
  || navigator.msGetUserMedia
  || function (a, b, fail) {
      return fail && fail(new Error('Your browser is too old :('))
    }
window.URL = window.URL
  || window.webkitURL
  || window.mozURL
  || window.msURL
window.performance = window.performance
  || { now: function () { return Date.now() } }

window.SHOW_FPS = true
window.REPEAT = 8
window.onload = init

var TRANSPARENT = 'rgba(0,0,0,0)'
var BLACK = 'rgba(0,0,0,1)'


function createVideo() {
  var video = document.createElement('video')
  video.width = 640
  video.height = 480
  video.autoplay = true

  var success = function(localMediaStream) {
    video.src = window.URL.createObjectURL(localMediaStream)
  }
  var fail = function(err) {
    console.log(err)
    if (err.code === 1) {
      console.log('User declined permissions.')
    }
    alert('It isn\'t cool without video input :(')
  }
  navigator.getUserMedia({ video: true }, success, fail)

  return video
}

function clear(ctx, x, y, w, h) {
  if (arguments.length === 1) {
    x = y = 0
    w = ctx.canvas.width
    h = ctx.canvas.height
  }
  ctx.clearRect(x, y, w, h)
}

function drawVideo(ctx, src) {
  ctx.drawImage(src, 0, 0, src.videoWidth, src.videoHeight, 0, 0, ctx.canvas.width, ctx.canvas.height)
}

function drawCanvas(ctx, src) {
  ctx.drawImage(src.canvas, 0, 0)
}

function createCanvasContext(w, h) {
  var canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  return canvas.getContext('2d')
}

function init() {
  var last = window.performance.now()
  var video = createVideo()
  var w = video.width
    , h = video.height

  var ctx = createCanvasContext(w, h)
  document.body.appendChild(ctx.canvas)

  var tmpctx = createCanvasContext(w, h)
  var gradctx = createCanvasContext(w, h)


  function whoadude2(src, dst, gradctx) {
    var split = REPEAT * 2 + 4

    dst.drawImage(src.canvas, 0, 0, w, h)

    src.save()
    src.translate(w/2, h/2)
    // src.rotate(Math.PI/32 - Math.PI/16 * Math.random())
    src.rotate(Math.cos(last/500) / Math.PI)
    src.translate(-w/2, -h/2)
    src.drawImage(dst.canvas, 0, 0, w, h)
    src.restore()


    var gradient = gradctx.createLinearGradient(0, 0, w, 0)
    gradient.addColorStop(0, TRANSPARENT)
    gradient.addColorStop(0.5, BLACK)
    gradient.addColorStop(1, BLACK)
    drawCanvas(gradctx, src)
    gradctx.save()
    gradctx.globalCompositeOperation = 'destination-out'
    // gradctx.translate(-w/2, -h/2)
    // gradctx.rotate(Math.PI/16 - Math.PI/8 * Math.random())
    gradctx.fillStyle = gradient
    gradctx.fillRect(0, 0, w, h)
    // gradctx.translate(w/2, h/2)
    gradctx.restore()

    for (i = 1; i <= REPEAT; ++i) {
      dst.drawImage(gradctx.canvas, -i * w/split, 0, w, h)
    }

    gradient = gradctx.createLinearGradient(0, 0, w, 0)
    clear(gradctx)
    gradient.addColorStop(0, BLACK)
    gradient.addColorStop(0.5, BLACK)
    gradient.addColorStop(1, TRANSPARENT)
    drawCanvas(gradctx, src)
    gradctx.save()
    gradctx.globalCompositeOperation = 'destination-out'
    // gradctx.translate(-w/2, -h/2)
    // gradctx.rotate(Math.PI/16 - Math.PI/8 * Math.random())
    gradctx.fillStyle = gradient
    gradctx.fillRect(0, 0, w, h)
    // gradctx.translate(w/2, h/2)
    gradctx.restore()

    for (i = 1; i <= REPEAT; ++i) {
      dst.drawImage(gradctx.canvas, i * w/split, 0, w, h)
    }
  }


  function update(delta) {
    tmpctx.save()
    tmpctx.scale(-1, 1)
    tmpctx.translate(-tmpctx.canvas.width, 0)
    drawVideo(tmpctx, video)
    tmpctx.restore()
  }

  var frames = 0, elapsed = 0
  function render(delta) {
    clear(ctx)
    whoadude2(tmpctx, ctx)
    frames++
    elapsed += delta

    if (SHOW_FPS) {
      ctx.fillStyle = 'black'
      ctx.fillRect(0, 0, 50, 20)
      ctx.fillStyle = 'white'
      ctx.fillText(Math.round(frames/(elapsed / 1000) * 10)/10 + ' fps', 5, 14)
    }
  }

  function loop() {
    var time = window.performance.now()
    update(time - last)
    render(time - last)
    last = time
    requestAnimationFrame(loop)
  }

  loop()
}
