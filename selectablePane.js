//@ts-check
//@ts-ignore
define(() => {
    //@ts-check
    function create(/** @type {HTMLElement} */element, options = { collectChildren: false }) {
        const selectedPaneIdAttr = 'data-selected-pane-id';
        const paneIdAttr = 'data-selectable-pane-id';
        const selectablePaneClass = 'selectable-pane';

        /**
         * @param {Element} elem
         * @param {string} name
         * @param {string} value
         */
        function updateAttr(elem, name, value) {
            const old = elem.getAttribute(name);
            if (old !== value) {
                elem.setAttribute(name, value);
            }
            return old;
        }
        class SelectablePane {

            /** @type {(Element | undefined)[]} */
            #panes = [];
            /** @type {number[]} */
            #freeIdList = [];
            #element;
            #observer;

            /**
             * @param {Element} element
             */
            constructor(element) {
                element.classList.add(selectablePaneClass);
                const observer = new MutationObserver(mutations => this.#onElementChanged(mutations));
                observer.observe(element, { attributes: true, childList: true });
                this.#element = element;
                this.#observer = observer;
            }

            get panes() {
                return [...this.#panes];
            }

            get selectedId() {
                const attr = this.#element.getAttribute(selectedPaneIdAttr) ?? 'none';
                if (attr === 'none') {
                    return undefined;
                }
                const id = parseInt(attr);
                if (!Number.isInteger(id)) {
                    return undefined;
                }
                return id;
            }

            get selected() {
                const id = this.selectedId;
                if (!id) {
                    return undefined;
                }
                return this.#panes[id];
            }

            /**
             * @param {number | undefined} id
             */
            select(id) {
                let selected = (id !== undefined) && Number.isInteger(id) ? this.#panes[id] : undefined;
                const idStr = (id !== undefined) ? `${id}` : 'none';
                if (selected?.getAttribute(paneIdAttr) !== idStr) {
                    selected = undefined;
                }
                if (selected) {
                    this.#element.replaceChildren(selected);
                } else {
                    this.#element.replaceChildren();
                    if (id) this.#freeId(id);
                }
                updateAttr(this.#element, selectedPaneIdAttr, idStr);
            }

            /**
             * @param {Element} elem
             */
            add(elem) {
                const id = this.#allocId();
                elem.setAttribute(paneIdAttr, `${id}`);
                this.#panes[id] = elem;
                return id;
            }

            /**
             * @param { number } id
             */
            remove(id) {
                const pane = this.#panes[id];
                pane?.removeAttribute(paneIdAttr);
                this.#freeId(id);
            }

            count() {
                return this.#panes.length - this.#freeIdList.length;
            }

            /**
             * @param {MutationRecord[]} mutations
             */
            #onElementChanged(mutations) {
                for (const mutation of mutations) {
                    switch (mutation.type) {
                        case 'attributes':
                            this.#onAttributeChanged(/** @type {string} */(mutation.attributeName));
                            break;
                        case 'childList':
                            this.#onChildListChanged(mutation.addedNodes, mutation.removedNodes);
                            break;
                    }
                }
            }
            /**
             * @param {string} attributeName
             */
            #onAttributeChanged(attributeName) {
                if (attributeName !== selectedPaneIdAttr) {
                    return;
                }
                this.select(this.selectedId);
            }
            /**
             * @param {NodeList} addedNodes 
             * @param {NodeList} removedNodes 
             */
            #onChildListChanged(addedNodes, removedNodes) {
                const element = this.#element;
                for (const added of addedNodes) {
                    if (!(added instanceof Element)) {
                        continue;
                    }
                    if (added.hasAttribute(paneIdAttr)) {
                        continue;
                    }
                    element.removeChild(added);
                    this.add(added);
                }
            }


            #allocId() {
                return this.#freeIdList.pop() ?? this.#panes.length;
            }

            /**
             * @param {number} id
             */
            #freeId(id) {
                if (!Number.isInteger(id) || !this.#panes[id]) {
                    return;
                }
                this.#panes[id] = undefined;
                this.#freeIdList.push(id);
            }
        }

        const children = options.collectChildren ? [...element.children] : [];
        element.replaceChildren();

        const pane = new SelectablePane(element);
        for (const child of children) {
            pane.add(child);
        }

        return pane;
    }


    return {
        create
    };
});