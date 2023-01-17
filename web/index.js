const apiUrl = 'http://localhost:3000/'
let counter = 0


async function consumerApi(signal){
    const response = await fetch(apiUrl, {
      signal
    })
    const reader = response.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(parsedNDJSON())

    return reader
}

function parsedNDJSON(){
  let ndjsonBuffer = ''
  return new TransformStream({
    transform(chunk, controller){
      ndjsonBuffer += chunk
      const items = ndjsonBuffer.split('\n')
      items.slice(0,-1)
      .forEach(item => controller.enqueue(JSON.parse(item)))

      ndjsonBuffer = items[items.length-1]
    },
    flush(controller){
      if(!ndjsonBuffer) return;
      controller.enqueue(JSON.parse(ndjsonBuffer))
    }
  })
}

function appendToHTML(element){
  return new WritableStream({
    write({
      idMovie,
      titleMovie,
      posterLink,
      releasedYear,
      genreMovie
    }){
      const data = 
      `
      <article>
      <div class="content">
      <img class="img-movie" src="${posterLink}" width="50" height="50"/>
      <div class="content-movie">
      <h2>
      #${idMovie+1} ${titleMovie}
      </h2>
      <span>Ano de lançamento: ${releasedYear}</span>
      <span>Gênero: ${releasedYear}</span>
      </div>
      </div>
      </article>
      `
      element.innerHTML += data
    },
    abort(reason){
      console.log('aborted', reason)
    }
  })
}

const [
  mainContainer,
  stopFetch,
  startFetch
] = ['mainContainer','stopFetch','startFetch'].map(item => document.getElementById(item))

let abortController = new AbortController()

startFetch.addEventListener('click', async () => {
  try{
    const readable = await consumerApi(abortController.signal)
    await readable.pipeTo(appendToHTML(mainContainer), {signal: abortController.signal})
  }catch(error){
    if (!error.message.includes('abort')) throw error
  }
})

stopFetch.addEventListener('click', () => {
  abortController.abort()
  cosole.log('aborting...')
  abortController = new AbortController()
})

