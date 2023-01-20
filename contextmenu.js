//@ts-check
//@ts-ignore
define(() => {
    //@ts-check
    function init() {
        const wrapper = document.createElement('div');
        const container = document.createElement('div');
        container.style.display = 'block';
        container.style.width = container.style.height = 'min-content';
        container.style.position = 'absolute';
        container.style.pointerEvents = 'auto';
        container.classList.add('contextmenu');

        wrapper.style.position = 'absolute';
        wrapper.style.top = wrapper.style.left = '0px';
        wrapper.style.width = wrapper.style.height = '100%';
        wrapper.style.pointerEvents = 'none';
        wrapper.classList.add('contextmenu-wrapper');
        wrapper.append(container);

        const instance = { wrapper, container, onclose: (e) => { } };

        window.addEventListener('pointerdown', (event) => {
            if (event.target instanceof Node && container.contains(event.target)) {
                return;
            }

            container.blur();
            container.replaceChildren();
            wrapper.remove();

            instance.onclose?.(event);
        });

        return instance;
    }

    const defaultSettings = { originX: 0, originY: 0 };

    /** @type {{ container: HTMLDivElement, wrapper:HTMLDivElement, onclose?: EventListener } | null} */
    let instance = null;

    /**
     * @param {number} x
     * @param {number} y
     * @param {(string | Node)[] | Node} content
     * @param {{originX?: number, originY?: number, onclose?: EventListener}} [options]
     */
    function display(x, y, content, options) {
        const { container, wrapper } = instance ??= init();
        if (Array.isArray(content)) {
            container.replaceChildren(...content);
        } else {
            container.replaceChildren(content);
        }
        document.body.append(wrapper);
        const { width, height } = container.getBoundingClientRect();
        const opts = { ...defaultSettings, ...options };
        instance.onclose = opts.onclose;
        container.style.top = `${y - (height * opts.originY)}px`;
        container.style.left = `${x - (width * opts.originX)}px`;
        container.focus();
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {Object} content
     * @param {{originX?: number, originY?: number, onclose?: EventListener}} [options]
     */
    function displayObject(x, y, content, options) {
        const c = createContent(content);
        display(x, y, c, options);

        /**
         * @param {Object} content
         * @param {{ level? : boolean }} [options]
         */
        function createContent(content, options) {
            const opts = { ...{ level: true }, ...options };

            if (Array.isArray(content)) {
                const group = document.createElement('div');
                group.classList.add('contextmenu-node', 'contextmenu-level', 'contextmenu-group');
                for (const value of content) {
                    group.append(createContent(value, { level: false }));
                }
                return group;
            } else {
                const list = document.createElement('ul');
                if (opts.level) list.classList.add('contextmenu-level');
                list.classList.add('contextmenu-node');
                for (const [key, value] of Object.entries(content)) {
                    const elem = document.createElement('li');
                    elem.classList.add('contextmenu-node');
                    elem.style.transform = 'translate(0, 0)';
                    const label = document.createElement('span');
                    label.classList.add('contextmenu-label');
                    label.textContent = key;
                    if (value instanceof Function) {
                        elem.classList.add('contextmenu-leaf');
                        elem.appendChild(label);
                        elem.addEventListener('click', value);
                    } else {
                        elem.appendChild(label);
                        elem.appendChild(createContent(value, { level: true }));
                    }
                    list.append(elem);
                }
                return list;
            }

        }
    }

    return {
        display,
        displayObject
    };
});