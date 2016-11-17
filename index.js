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

window.SHOW_FPS = false
window.COLOR_DURATION = 2000
window.NUM_COLORS = 6
window.FADE = 1.075
window.onload = init

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
    alert('bruh, you gotta let me use your video for this to work...')
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
  var sx = 0, sy = 0,
    sw = src.videoWidth,
    sh = src.videoHeight,
    dx = 0, dy = 0,
    dw = ctx.canvas.width,
    dh = ctx.canvas.height;
  ctx.drawImage(src, sx, sy, sw, sh, dx, dy, dw, dh)
}

function drawCanvas(ctx1, ctx2) {
  ctx1.drawImage(ctx2.canvas, 0, 0)
}

function createCanvasContext(w, h, src) {
  var canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  return canvas.getContext('2d')
}

function colorDistance(c1, c2) {
  var rmean = (c1[0] + c2[0]) / 2,
    r = c1[0] - c2[0],
    g = c1[1] - c2[1],
    b = c1[2] - c2[2]
  return Math.sqrt((((512+rmean)*r*r)>>8) + 4*g*g + (((767-rmean)*b*b)>>8))
}

function reduceImage(ctx, colors) {
  var imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)
  var pixel = [0,0,0], dist, bestDist, bestColor, numColors = colors.length

  for (var i = 0, l = imageData.data.length; i < l; i+=4) {
    pixel[0] = imageData.data[i]
    pixel[1] = imageData.data[i+1]
    pixel[2] = imageData.data[i+2]
    bestDist = false
    for (var c = 0; c < numColors; ++c) {
      dist = colorDistance(colors[c], pixel)
      if (bestDist === false || dist < bestDist) {
        bestColor = colors[c]
        bestDist = dist
      }
    }
    imageData.data[i] = bestColor[0]
    imageData.data[i+1] = bestColor[1]
    imageData.data[i+2] = bestColor[2]
  }

  ctx.putImageData(imageData, 0, 0)
}

function whoadude(src, dst) {
  var srcData = src.getImageData(0, 0, src.canvas.width, src.canvas.height)
  var dstData = dst.getImageData(0, 0, dst.canvas.width, dst.canvas.height)

  var srcv, dstv

  for (var i = 0, l = srcData.data.length; i < l; ++i) {
    srcv = srcData.data[i]
    dstv = dstData.data[i]

    dstData.data[i] = Math.floor(srcv + (dstv - srcv) / FADE)
  }

  dst.putImageData(dstData, 0, 0)
}

function randomColor() {
  var h = Math.random() * 360
    , s = 40 + Math.random() * 60
    , l = 25 + Math.random() * 50
  return hsl2rgb(h, s, l)
}

function hsl2rgb(h, s, l) {
  var m1, m2, hue
  var r, g, b
  s = s / 100
  l = l / 100
  if (s === 0) {
    r = g = b = (l * 255)
  } else {
    if (l <= 0.5) {
      m2 = l * (s + 1)
    } else {
      m2 = l + s - l * s
    }
    m1 = l * 2 - m2
    hue = h / 360
    r = hue2rgb(m1, m2, hue + 1/3)
    g = hue2rgb(m1, m2, hue)
    b = hue2rgb(m1, m2, hue - 1/3)
  }
  return [r, g, b]
}

function hue2rgb(m1, m2, hue) {
  var v
  if (hue < 0) {
    hue += 1
  } else if (hue > 1) {
    hue -= 1
  }

  if (6 * hue < 1) {
    v = m1 + (m2 - m1) * hue * 6
  } else if (2 * hue < 1) {
    v = m2
  } else if (3 * hue < 2) {
    v = m1 + (m2 - m1) * (2/3 - hue) * 6
  } else {
    v = m1
  }

  return 255 * v
}

function init() {
  var last = window.performance.now()
  var video = createVideo()
  // document.body.appendChild(video)

  var ctx = createCanvasContext(video.width, video.height)
  document.body.appendChild(ctx.canvas)

  var tmpctx = createCanvasContext(video.width, video.height)

  var colors = []

  function update(delta) {

    if (elapsed === 0) {
      colors = [[0,0,0], [255, 255, 255]]
      while (colors.length < window.NUM_COLORS) {
        colors.push(randomColor())
      }
    }

    tmpctx.save()
    tmpctx.scale(-1, 1)
    tmpctx.translate(-tmpctx.canvas.width, 0)
    drawVideo(tmpctx, video)
    tmpctx.restore()

    reduceImage(tmpctx, colors)
  }

  var frames = 0, elapsed = 0
  function render(delta) {
    whoadude(tmpctx, ctx)
    frames++
    elapsed += delta

    if (SHOW_FPS) {
      ctx.fillStyle = 'black'
      ctx.fillRect(0, 0, 50, 20)
      ctx.fillStyle = 'white'
      ctx.fillText(Math.round(frames/(elapsed / 1000) * 10)/10 + ' fps', 5, 14)
    }

    if (elapsed > COLOR_DURATION) {
      elapsed = 0
      frames = 0
    }
  }

  var currentFID
  function loop() {
    var time = window.performance.now()
    update(time - last)
    render(time - last)
    last = time
    currentFID = requestAnimationFrame(loop)
  }

  // preserve aspect ratio with no black space (fill screen)
  function resize() {
    var sw = window.innerWidth,
      sh = window.innerHeight,
      cw = ctx.canvas.width,
      ch = ctx.canvas.height,
      sr = sw / sh,
      cr = cw / ch,
      w, h, x, y

    if (sr > cr) {
      w = sw
      h = w / cr
    } else {
      h = sh
      w = h * cr
    }

    x = (sw - w) / 2
    y = (sh - h) / 2

    ctx.canvas.style.width = w + 'px';
    ctx.canvas.style.height = h + 'px';
    ctx.canvas.style.left = x + 'px';
    ctx.canvas.style.top = y + 'px';
  }

  window.onresize = resize
  window.start = loop
  window.stop = function () {
    cancelAnimationFrame(currentFID)
  }

  // start!
  loop()
  resize()
}
