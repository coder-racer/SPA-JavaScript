class Test {
    host = ''
    #fullBlock = null
    #body = null
    #eventList = {}
    #tplFolder = 'tpl'
    #mainLocation = 'index'
    #errorLocation = '404'
    #currentLocation = null
    templates = {}
    #globalBlocks = {}
    #globalEvents = {}
    #param = []
    #blockList = {
        'body': null,
        'additional': null
    }

    getMainTpl() {
        return this.#mainLocation
    }

    getLocation()
    {
        return this.#currentLocation;
    }

    setMainTpl(tpl) {
        this.#mainLocation = tpl
    }

    #callBackContentUpdate = () => {
    }

    constructor(fullBlock, body) {
        if (/complete|interactive|loaded/.test(document.readyState)) {
            this.run(fullBlock, body)
        } else {
            document.addEventListener("DOMContentLoaded", () => {
                this.run(fullBlock, body)
            })
        }
    }

    setCallBackContentUpdate(func) {
        this.#callBackContentUpdate = func;
    }

    getParam() {
        return this.#param
    }

    getBlock(block) {
        return this.#body.querySelector(block)
    }


    bind(block, content) {
        if (!this.#fullBlock.querySelector(block))
            return null

        this.#fullBlock.querySelector(block).innerHTML = content
    }

    locationReload() {
        this.templates[this.#currentLocation]()
    }

    run(fullBlock, body) {
        this.#fullBlock = document.querySelector(fullBlock)
        this.#blockList.body = this.#fullBlock.querySelector(body)
        this.#body = this.#fullBlock.querySelector(body)
        this.setHistoryEvent()
        this.location()
    }

    setContent(content) {
        this.#body.innerHTML = content
        this.#callBackContentUpdate()
    }

    clearContent() {
        this.setContent('')
    }

    parseHistory(url = null) {
        let mabeUrl = location.href.replace(location.origin, '')
        let fullUrl = (url == null) ? mabeUrl : url

        if (fullUrl[0] === '/' || fullUrl[0] === '\\')
            fullUrl = fullUrl.substring(1)

        let listUrl = fullUrl.split('#')

        let baseUrl = listUrl[0]

        listUrl.shift()

        this.#param = listUrl
        return {
            'base': baseUrl,
            'url': fullUrl
        }
    }

    locationBack() {
        window.history.back()
    }

    locationForward() {
        window.history.forward()
    }

    appendGlobalBlock(name, block) {
        if (!this.#fullBlock.querySelector(block))
            return null;
        this.#globalBlocks[name] = (this.#fullBlock.querySelector(block))
    }

    setGBlock(name, content) {
        if (this.#globalBlocks[name])
            this.#globalBlocks[name].innerHTML = content;
    }

    setHistoryEvent() {
        window.addEventListener('popstate', (e) => {
            // if (e?.state?.url)
            this.location(e.state.url, false)
        }, false)
    }

    showLoader(block = this.#body, full = false) {
        let html = `
            <div class="preloader">
                <div class="preloader_block">
                    <img src="/img/svg/preloader.svg" alt="">
                </div>
            </div>
        `;
        if (full)
            block.innerHTML = html;
        else
            block.insertAdjacentHTML('beforeend', html);

        document.querySelector('.preloader').classList.add('active')
    }

    hideLoader() {
        this.#fullBlock.querySelectorAll('.preloader').forEach(el => {

                el.classList.remove('active')

                setTimeout(() => el.remove(), 400)

            }
        )
    }

    location(url = null, historyPush = true) {
        let historyList = this.parseHistory(url)
        url = historyList.base

        if (this.#currentLocation === url && url != 'customcert')
            return;

        if (historyPush)
            history.pushState({url: historyList.url}, '', historyList.url)

        if (!url.length)
            url = this.#mainLocation

        this.clearAllEvents()
        this.clearContent()

        this.#currentLocation = url

        if (!this.templates.hasOwnProperty(url)) {
            let elem = document.createElement('script')
            elem.src = '/' + this.#tplFolder + '/' + url + '.js?v=' + Math.random()

            document.body.appendChild(elem)
            elem.onerror = () => {
                this.location(this.#errorLocation)
            }
            elem.onload = () => {
                this.templates[url]()
            }
        } else {
            this.templates[url]()
        }

    }

    on(eventName, block, func, global = false) {
        if (!global && !this.#eventList[eventName]) {
            this.#eventList[eventName] = {
                'func': eventPush,
                'list': {}
            }
            this.#fullBlock.addEventListener(eventName, eventPush, false)
        } else if (global && !this.#globalEvents[eventName]) {
            this.#globalEvents[eventName] = {
                'func': eventPushGlobal,
                'list': {}
            }
            this.#fullBlock.addEventListener(eventName, eventPushGlobal, false)
        }

        if (!global && !this.#eventList[eventName]['list'][block]) {
            this.#eventList[eventName]['list'][block] = func
        } else if (global && !this.#globalEvents[eventName]['list'][block]) {
            this.#globalEvents[eventName]['list'][block] = func
        }

        let thisClass = this

        function eventPush(event) {
            let elem = []
            if (thisClass.#eventList[event.type]?.['list']) {
                Object.entries(thisClass.#eventList[event.type]?.['list']).forEach(entry => {
                    const [element, funcElem] = entry
                    if (!elem.includes(element)) {
                        elem.push(element)
                        push(element, event.target, funcElem, event)
                    }
                })
            }
        }

        function eventPushGlobal(event) {
            if (thisClass.#globalEvents[event.type]?.['list']) {
                Object.entries(thisClass.#globalEvents[event.type]?.['list']).forEach(entry => {
                    const [element, funcElem] = entry
                    push(element, event.target, funcElem, event)
                })
            }
        }

        function push(block, target, func, event) {
            if (Array.prototype.indexOf.call(document.querySelectorAll(block), target) !== -1) {
                event.preventDefault()
                func(target, event)
                return;
            }

            let target_next = target?.parentElement
            if (target_next)
                push(block, target_next, func, event)
        }

    }

    clearAllEvents() {
        Object.entries(this.#eventList).forEach(entry => {
            const [eventName, value] = entry
            let func = value['func']
            this.#fullBlock.removeEventListener(eventName, func, false)
        })
        this.#eventList = {}
    }

}

window.App = new Test('body', '.container_app')