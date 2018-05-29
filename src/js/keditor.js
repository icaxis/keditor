(function (window, $) {
    // Log function will print log message
    const flog = (...args) => {
        if (console && typeof console.log === 'function' && KEditor.debug === true) {
            console.log.apply(console, ['[ KEditor ] ', ...args]);
        }
    };

    // Throw error message
    const error = (message) => {
        throw new Error(`[ KEditor ] ${message}`);
    };

    // Check dependencies
    if (!$.fn.sortable) {
        error('$.fn.sortable does not exist. Please import $.fn.sortable into your document for continue using KEditor.');
    }

    const DEFAULTS = {
        nestedContainerEnabled: true,
        btnAddContainerText: '<i class="fa fa-plus"></i> <i class="fa fa-fw fa-columns"></i>',
        btnAddSubContainerText: '<i class="fa fa-plus"></i> <i class="fa fa-fw fa-columns"></i>',
        btnAddComponentText: '<i class="fa fa-plus"></i> <i class="fa fa-fw fa-list-ul"></i>',
        btnMoveContainerText: '<i class="fa fa-sort"></i>',
        btnMoveComponentText: '<i class="fa fa-arrows"></i>',
        btnSettingContainerText: '<i class="fa fa-cog"></i>',
        btnSettingComponentText: '<i class="fa fa-cog"></i>',
        btnDuplicateContainerText: '<i class="fa fa-files-o"></i>',
        btnDuplicateComponentText: '<i class="fa fa-files-o"></i>',
        btnDeleteContainerText: '<i class="fa fa-times"></i>',
        btnDeleteComponentText: '<i class="fa fa-times"></i>',
        defaultComponentType: 'blank',
        snippetsUrl: 'snippets/snippets.html',
        snippetsFilterEnabled: true,
        snippetsCategoriesSeparator: ';',
        iframeMode: false,
        contentStyles: [],
        contentAreasSelector: null,
        contentAreasWrapper: '<div class="keditor-ui keditor-content-areas-wrapper"></div>',
        containerSettingEnabled: false,
        containerSettingInitFunction: null,
        containerSettingShowFunction: null,
        containerSettingHideFunction: null,
        onReady: function () {
        },

        onSnippetsLoaded: function (modal) {

        },
        onSnippetsError: function (modal, error) {

        },

        onInitIframe: function (iframe, iframeHead, iframeBody) {
        },
        onContentChanged: function (event, contentArea) {
        },

        onBeforeInitContentArea: function (contentArea) {
        },
        onInitContentArea: function (contentArea) {
        },

        onBeforeInitContainer: function (container, contentArea) {
        },
        onInitContainer: function (container, contentArea) {
        },
        onBeforeContainerDeleted: function (event, selectedContainer, contentArea) {
        },
        onContainerDeleted: function (event, selectedContainer, contentArea) {
        },
        onContainerChanged: function (event, changedContainer, contentArea) {
        },
        onContainerDuplicated: function (event, originalContainer, newContainer, contentArea) {
        },
        onContainerSelected: function (event, selectedContainer, contentArea) {
        },
        onContainerSnippetAdded: function (event, newContainer, selectedSnippet, contentArea) {
        },

        onComponentReady: function (component) {
        },
        onBeforeInitComponent: function (component, contentArea) {
        },
        onInitComponent: function (component, contentArea) {
        },
        onBeforeComponentDeleted: function (event, selectedComponent, contentArea) {
        },
        onComponentDeleted: function (event, selectedComponent, contentArea) {
        },
        onComponentChanged: function (event, changedComponent, contentArea) {
        },
        onComponentDuplicated: function (event, originalComponent, newComponent, contentArea) {
        },
        onComponentSelected: function (event, selectedComponent, contentArea) {
        },
        onComponentSnippetAdded: function (event, newComponent, selectedSnippet, contentArea) {
        },

        onBeforeDynamicContentLoad: function (dynamicElement, component, contentArea) {
        },
        onDynamicContentLoaded: function (dynamicElement, response, status, xhr, contentArea) {
        },
        onDynamicContentError: function (dynamicElement, response, status, xhr, contentArea) {
        }
    };

    const MODAL_ACTION = {
        ADD_CONTAINER: 0,
        ADD_SUB_CONTAINER: 1,
        ADD_COMPONENT: 2
    };

    const TOOLBAR_TYPE = {
        CONTENT_AREA: 0,
        CONTAINER: 1,
        SUB_CONTAINER: 2,
        CONTAINER_CONTENT: 3,
        SUB_CONTAINER_CONTENT: 4,
        COMPONENT: 5
    };

    // KEditor class
    class KEditor {
        constructor(target, config) {
            let self = this;
            let element = self.element = target;
            let options = self.options = $.extend({}, DEFAULTS, config);

            if (options.iframeMode) {
                self.initIframe();
            } else {
                self.window = window;
                self.body = $(document.body);

                let originalContent = element.val() || element.html() || '';
                let contentAreasWrapper = self.generateContentAreasWrapper(originalContent);

                if (element.is('textarea')) {
                    element.after(contentAreasWrapper);
                    element.addClass('keditor-hidden-element');
                } else {
                    element.empty().append(contentAreasWrapper);
                }

                self.contentAreasWrapper = contentAreasWrapper;
            }

            self.initSidebar();
            self.initSnippetsModal();
            self.initContentAreas();

            if (!self.body.hasClass('keditor-clicks-initialized')) {
                self.initKEditorClicks();
            }

            self.id = self.generateId();
            KEditor.instances[self.id] = self;

            if (typeof options.onReady === 'function') {
                options.onReady.call(self);
            }
        }

        // Utils
        //---------------------------------
        generateId(type = '') {
            let timestamp = (new Date()).getTime();
            let random = Math.round(Math.random() * 9876543210);
            return `keditor-${type}-${timestamp}${random}`;
        }

        generateContentAreasWrapper(content) {
            let self = this;
            let options = self.options;

            let contentAreasWrapper = $(options.contentAreasWrapper || '<div />');
            contentAreasWrapper.attr('class', 'keditor-ui keditor-content-area-wrapper');

            if (!contentAreasWrapper.attr('id')) {
                contentAreasWrapper.attr('id', self.generateId('content-area-wrapper'));
            }

            contentAreasWrapper.html(content);

            return contentAreasWrapper;
        }

        generateToolbar(type, isComponentConfigurable) {
            let self = this;
            let options = self.options;
            let settingBtn = '';

            switch (type) {
                case  TOOLBAR_TYPE.CONTENT_AREA:
                    return (`                    
                        <div class="keditor-ui keditor-content-area-toolbar">
                            <a href="javascript:void(0)" class="keditor-ui keditor-btn keditor-btn-default btn-add-container" title="Add container">${options.btnAddContainerText}</a>
                        </div>
                    `);

                case  TOOLBAR_TYPE.CONTAINER:
                    if (options.containerSettingEnabled === true) {
                        settingBtn = `<a href="javascript:void(0);" class="keditor-ui btn-container-setting">${options.btnSettingContainerText}</a>`;
                    }

                    return (`
                        <div class="keditor-toolbar keditor-toolbar-container">
                            <a href="javascript:void(0);" class="keditor-ui btn-container-reposition">${options.btnMoveContainerText}</a>
                            ${settingBtn}
                            <a href="javascript:void(0);" class="keditor-ui btn-container-duplicate">${options.btnDuplicateContainerText}</a>
                            <a href="javascript:void(0);" class="keditor-ui btn-container-delete">${options.btnDeleteContainerText}</a>
                        </div>
                    `);

                case  TOOLBAR_TYPE.SUB_CONTAINER:
                    if (options.containerSettingEnabled === true) {
                        settingBtn = `<a href="javascript:void(0);" class="keditor-ui btn-container-setting">${options.btnSettingContainerText}</a>`;
                    }

                    return (`
                        <div class="keditor-toolbar keditor-toolbar-container keditor-toolbar-sub-container">
                            <a href="javascript:void(0);" class="keditor-ui btn-container-reposition">${options.btnMoveContainerText}</a>
                            ${settingBtn}
                            <a href="javascript:void(0);" class="keditor-ui btn-container-duplicate">${options.btnDuplicateContainerText}</a>
                            <a href="javascript:void(0);" class="keditor-ui btn-container-delete">${options.btnDeleteContainerText}</a>
                        </div>
                    `);

                case  TOOLBAR_TYPE.CONTAINER_CONTENT:
                    return (`          
                        <div class="keditor-ui keditor-container-content-toolbar keditor-btn-group">
                            <a href="javascript:void(0)" class="keditor-ui keditor-btn keditor-btn-default btn-add-container" title="Add sub-container">${options.btnAddSubContainerText}</a>
                            <a href="javascript:void(0)" class="keditor-ui keditor-btn keditor-btn-default btn-add-component" title="Add component">${options.btnAddComponentText}</a>
                        </div>
                    `);

                case  TOOLBAR_TYPE.SUB_CONTAINER_CONTENT:
                    return (`
                        <div class="keditor-ui keditor-container-content-toolbar">
                            <a href="javascript:void(0)" class="keditor-ui keditor-btn keditor-btn-default btn-add-component" title="Add component">${options.btnAddComponentText}</a>
                        </div>
                    `);

                case  TOOLBAR_TYPE.COMPONENT:
                    if (isComponentConfigurable) {
                        settingBtn = `<a href="javascript:void(0);" class="keditor-ui btn-component-setting">${options.btnSettingComponentText}</a>`;
                    }

                    return (`
                        <div class="keditor-toolbar keditor-toolbar-component">
                            <a href="javascript:void(0);" class="keditor-ui btn-component-reposition">${options.btnMoveComponentText}</a>
                            ${settingBtn}
                            <a href="javascript:void(0);" class="keditor-ui btn-component-duplicate">${options.btnDuplicateComponentText}</a>
                            <a href="javascript:void(0);" class="keditor-ui btn-component-delete">${options.btnDeleteComponentText}</a>
                        </div>
                    `);

                default:
                // Do nothing
            }
        }

        beautifyCategories(categories) {
            let newArray = [];
            for (let i = 0; i < categories.length; i++) {
                let category = categories[i] || '';

                if (category !== '' && $.inArray(category, newArray) === -1) {
                    newArray.push(category);
                }
            }

            return newArray.sort();
        }

        setSettingContainer(container) {
            this.settingContainer = container;
        }

        getSettingContainer() {
            return this.settingContainer;
        }

        setSettingComponent(component) {
            this.settingComponent = component;
        }

        getSettingComponent() {
            return this.settingComponent;
        }

        getDataAttributes(target, ignoreAttributes, isArray) {
            let dataAttributes = isArray ? [] : {};
            if (!ignoreAttributes) {
                ignoreAttributes = [];
            }

            $.each(target.get(0).attributes, function (i, attr) {
                if (attr.name.indexOf('data-') === 0 && $.inArray(attr.name, ignoreAttributes) === -1) {
                    if (isArray) {
                        dataAttributes.push(`${attr.name}="${attr.value}"`);
                    } else {
                        dataAttributes[attr.name] = attr.value;
                    }
                }
            });

            return dataAttributes;
        }

        getComponentType(component) {
            let self = this;
            let options = self.options;

            let componentType = (component.attr('data-type') || '').replace('component-', '');
            if (componentType && (componentType in KEditor.components)) {
                return componentType;
            } else {
                if (typeof options.defaultComponentType === 'string') {
                    componentType = options.defaultComponentType;
                } else if (typeof options.defaultComponentType === 'function') {
                    componentType = options.defaultComponentType.call(self, component);
                }

                if (!componentType) {
                    error('Component type is undefined!');
                }

                flog(`Fallback to defaultComponentType: ${componentType}`);
                return componentType;
            }
        }

        getClickedElement(event, selector) {
            let target = $(event.target);
            let closest = target.closest(selector);

            if (target.is(selector)) {
                return target;
            } else if (closest.length > 0) {
                return closest;
            } else {
                return null;
            }
        }

        // Iframe
        //---------------------------------
        initIframe() {
            flog('initIframe');

            let self = this;
            let options = self.options;
            let element = self.element;
            let originalContent = element.is('textarea') ? element.val() : element.html();
            let wrapper = self.iframeWrapper = $('<div class="keditor-ui keditor-iframe-wrapper"></div>');
            let iframe = self.iframe = $('<iframe class="keditor-ui keditor-iframe"></iframe>');

            element.after(wrapper);
            wrapper.attr('id', self.generateId('iframe-wrapper')).append(iframe);
            element.addClass('keditor-hidden-element');

            let iframeDoc = self.iframeDoc = iframe.contents();

            // Fix issue Firefox can't render content inside iframe
            // ======================================================
            iframeDoc.get(0).open();
            iframeDoc.get(0).close();
            // ======================================================

            self.window = iframe[0].contentWindow ? iframe[0].contentWindow : iframe[0].contentDocument.defaultView;
            let iframeHead = self.iframeHead = iframeDoc.find('head');
            let iframeBody = self.iframeBody = self.body = iframeDoc.find('body');

            flog('Adding styles to iframe...');
            let styles = '';
            $('[data-type="keditor-style"]').each(function () {
                let style = $(this);
                let href = style.attr('href') || style.attr('data-href') || '';

                if (href) {
                    styles += `<link rel="stylesheet" type="text/css" href="${href}" />\n`;
                } else {
                    styles += `<style type="text/css">${style.html()}</style>\n`;
                }
            });

            if (options.contentStyles && $.isArray(options.contentStyles)) {
                $.each(options.contentStyles, function (i, style) {
                    let idStr = '';
                    if (style.id) {
                        idStr = ` id="${style.id}" `;
                    }

                    if (style.href) {
                        styles += `<link rel="stylesheet" type="text/css" href="${style.href}" ${idStr} />\n`;
                    } else {
                        styles += `<style type="text/css" ${idStr}>${style.content}</style>\n`;
                    }
                });
            }

            iframeHead.append(styles);

            flog('Adding original content to iframe...');
            let contentAreasWrapper = self.generateContentAreasWrapper(originalContent);
            iframeBody.append(contentAreasWrapper);
            self.contentAreasWrapper = contentAreasWrapper;

            if (typeof options.onInitIframe === 'function') {
                options.onInitIframe.call(self, iframe, iframeHead, iframeBody);
            }
        }

        // KEditor clicks
        //---------------------------------
        initKEditorClicks() {
            flog('initKEditorClicks');

            let self = this;
            let options = self.options;
            let body = self.body;

            body.on('click', function (e) {
                let sidebar = self.getClickedElement(e, '#keditor-sidebar');

                let container = self.getClickedElement(e, '.keditor-container');
                if (container) {
                    if (!container.hasClass('showed-keditor-toolbar')) {
                        body.find('.keditor-container.showed-keditor-toolbar').removeClass('showed-keditor-toolbar');
                        body.find('.keditor-component.showed-keditor-toolbar').removeClass('showed-keditor-toolbar');
                        container.addClass('showed-keditor-toolbar');

                        let contentArea = container.parent();
                        if (typeof options.onContainerSelected === 'function') {
                            options.onContainerSelected.call(self, e, container, contentArea);
                        }
                    }
                } else {
                    if (!sidebar) {
                        body.find('.keditor-container.showed-keditor-toolbar').removeClass('showed-keditor-toolbar');
                        body.find('.keditor-component.showed-keditor-toolbar').removeClass('showed-keditor-toolbar');
                    }
                }

                let component = self.getClickedElement(e, '.keditor-component');
                if (component) {
                    if (!component.hasClass('showed-keditor-toolbar')) {
                        body.find('.keditor-component.showed-keditor-toolbar').removeClass('showed-keditor-toolbar');
                        component.addClass('showed-keditor-toolbar');

                        let contentArea = component.parent();
                        if (typeof options.onComponentSelected === 'function') {
                            options.onComponentSelected.call(self, e, component, contentArea);
                        }
                    }
                } else {
                    if (!sidebar) {
                        body.find('.keditor-component.showed-keditor-toolbar').removeClass('showed-keditor-toolbar');
                    }
                }
            });

            body.on('click', '.btn-container-setting', function (e) {
                e.preventDefault();

                let btn = $(this);
                flog('Click on .btn-container-setting', btn);

                let container = btn.closest('.keditor-container');
                if (body.hasClass('opened-keditor-setting') && body.hasClass('opened-keditor-sidebar')) {
                    if (!container.is(self.settingContainer)) {
                        self.openSidebar(container);
                    } else {
                        self.closeSidebar();
                    }
                } else {
                    self.openSidebar(container);
                }
            });

            body.on('click', '.btn-container-duplicate', function (e) {
                e.preventDefault();

                let btn = $(this);
                flog('Click on .btn-container-duplicate', btn);

                let container = btn.closest('.keditor-container');
                let contentArea = container.parent();
                let newContainer = $(self.getContainerContent(container, btn.parent().hasClass('keditor-toolbar-sub-container')));
                container.after(newContainer);
                self.convertToContainer(contentArea, newContainer);

                flog('Container is duplicated');

                if (typeof options.onContainerDuplicated === 'function') {
                    options.onContainerDuplicated.call(self, container, newContainer, contentArea);
                }

                if (typeof options.onContentChanged === 'function') {
                    options.onContentChanged.call(self, e, contentArea);
                }
            });

            body.on('click', '.btn-container-delete', function (e) {
                e.preventDefault();

                let btn = $(this);
                flog('Click on .btn-container-delete', btn);

                if (confirm('Are you sure that you want to delete this container? This action can not be undo!')) {
                    let container = btn.closest('.keditor-container');
                    let components = container.find('.keditor-component');
                    let contentArea = container.parent();

                    if (typeof options.onBeforeContainerDeleted === 'function') {
                        options.onBeforeContainerDeleted.call(self, e, container, contentArea);
                    }

                    let settingComponent = self.settingComponent;
                    if (settingComponent) {
                        let settingComponentParent = settingComponent.closest('.keditor-container');
                        if (settingComponentParent.is(container)) {
                            flog('Deleting container is container of setting container. Close setting panel for this setting component', settingComponent);
                            self.closeSidebar();
                        }
                    } else if (container.is(self.settingContainer)) {
                        flog('Deleting container is setting container. Close setting panel for this container', container);
                        self.closeSidebar();
                    }

                    if (components.length > 0) {
                        components.each(function () {
                            self.deleteComponent($(this));
                        });
                    }

                    container.remove();

                    if (typeof options.onContainerDeleted === 'function') {
                        options.onContainerDeleted.call(self, e, container, contentArea);
                    }

                    if (typeof options.onContentChanged === 'function') {
                        options.onContentChanged.call(self, e, contentArea);
                    }
                }
            });

            body.on('click', '.btn-component-setting', function (e) {
                e.preventDefault();

                let btn = $(this);
                flog('Click on .btn-component-setting', btn);

                let component = btn.closest('.keditor-component');
                if (body.hasClass('opened-keditor-setting') && body.hasClass('opened-keditor-sidebar')) {
                    if (!component.is(self.settingComponent())) {
                        self.openSidebar(component);
                    } else {
                        self.closeSidebar();
                    }
                } else {
                    self.openSidebar(component);
                }
            });

            body.on('click', '.btn-component-duplicate', function (e) {
                e.preventDefault();

                let btn = $(this);
                flog('Click on .btn-component-duplicate', btn);

                let component = btn.closest('.keditor-component');
                let container = component.closest('.keditor-container');
                let contentArea = container.parent();
                let newComponent = $(self.getComponentContent(component));

                component.after(newComponent);
                self.convertToComponent(contentArea, container, newComponent);

                flog('Component is duplicated');

                if (typeof options.onComponentDuplicated === 'function') {
                    options.onComponentDuplicated.call(self, component, newComponent, contentArea);
                }

                if (typeof options.onContainerChanged === 'function') {
                    options.onContainerChanged.call(self, e, container, contentArea);
                }

                if (typeof options.onContentChanged === 'function') {
                    options.onContentChanged.call(self, e, contentArea);
                }
            });

            body.on('click', '.btn-component-delete', function (e) {
                e.preventDefault();

                let btn = $(this);
                flog('Click on .btn-component-delete', btn);

                if (confirm('Are you sure that you want to delete this component? This action can not be undo!')) {
                    let component = btn.closest('.keditor-component');
                    let container = component.closest('.keditor-container');
                    let contentArea = component.closest('.keditor-content-area');

                    if (typeof options.onBeforeComponentDeleted === 'function') {
                        options.onBeforeComponentDeleted.call(self, e, component, contentArea);
                    }

                    if (component.is(self.settingComponent)) {
                        self.closeSidebar();
                    }

                    self.deleteComponent(component);

                    if (typeof options.onComponentDeleted === 'function') {
                        options.onComponentDeleted.call(self, e, component, contentArea);
                    }

                    if (typeof options.onContainerChanged === 'function') {
                        options.onContainerChanged.call(self, e, container, contentArea);
                    }

                    if (typeof options.onContentChanged === 'function') {
                        options.onContentChanged.call(self, e, contentArea);
                    }
                }
            });

            body.addClass('keditor-clicks-initialized')
        }

        // Sidebar
        //---------------------------------
        initSidebar() {
            let self = this;
            let options = self.options;
            let sidebarId = self.generateId('sidebar');

            let sidebar = self.sidebar = $(`
                <div class="keditor-ui keditor-sidebar" id="${sidebarId}">                    
                    <div class="keditor-ui keditor-sidebar-header">
                        <span class="keditor-ui keditor-sidebar-title"></span>
                        <a href="javascript:void(0);" class="keditor-ui keditor-sidebar-close">&times;</a>
                    </div>
                    <div class="keditor-ui keditor-sidebar-body">
                        
                    </div>
                </div>
            `);

            sidebar.find('.keditor-sidebar-close').on('click', function (e) {
                e.preventDefault();

                self.closeSidebar();
            });

            let sidebarBody = sidebar.find('.keditor-sidebar-body');
            sidebarBody.on('submit', 'form', function (e) {
                e.preventDefault();
                return false;
            });

            if (options.containerSettingEnabled === true) {
                if (typeof options.containerSettingInitFunction === 'function') {

                    let form = $('<div  class="keditor-ui keditor-setting-form keditor-container-setting"></div>');
                    sidebarBody.append(form);

                    flog('Initialize container setting panel');
                    options.containerSettingInitFunction.call(self, form, self);
                } else {
                    error('"containerSettingInitFunction" is not function!');
                }
            }

            sidebar.appendTo(options.iframeMode ? self.iframeWrapper : self.body);
        }

        openSidebar(target) {
            let self = this;
            let options = self.options;
            let sidebar = self.sidebar;
            let sidebarTitle = sidebar.find('.keditor-sidebar-title');
            let sidebarBody = sidebar.find('.keditor-sidebar-body');
            let activeForm = sidebarBody.children('.active');
            activeForm.removeClass('active');

            if (target.is('.keditor-component')) {
                self.setSettingComponent(target);
                self.setSettingContainer(null);

                let componentType = self.getComponentType(target);
                let componentData = KEditor.components[componentType];
                sidebarTitle.html(componentData.settingTitle);

                let settingForm = sidebarBody.find(`.keditor-setting-${componentType}`);

                if (settingForm.length === 0) {
                    let componentData = KEditor.components[componentType];
                    if (typeof componentData.initSettingForm === 'function') {
                        settingForm = $(`
                            <div 
                                data-type="${componentType}" 
                                class="keditor-ui keditor-setting-form keditor-setting-${componentType} clearfix active"
                            >
                            </div>
                        `);
                        let loadingText = $('<span />').html('Loading...');
                        sidebarBody.append(settingForm);
                        settingForm.append(loadingText);

                        let initFunction = componentData.initSettingForm.call(componentData, settingForm, self);
                        $.when(initFunction).done(function () {
                            flog(`Initialized setting form for component type "${componentType}"`);

                            setTimeout(function () {
                                loadingText.remove();

                                if (typeof componentData.showSettingForm === 'function') {
                                    componentData.showSettingForm.call(componentData, settingForm, target, self);
                                }
                            }, 100);
                        });
                    }
                } else {
                    if (typeof componentData.showSettingForm === 'function') {
                        componentData.showSettingForm.call(componentData, settingForm, target, self);
                    }
                    settingForm.addClass('active');
                }
            } else {
                self.setSettingContainer(target);
                self.setSettingComponent(null);

                sidebarTitle.html("Container Settings");

                let settingForm = sidebar.find('.keditor-container-setting');
                if (typeof options.containerSettingShowFunction === 'function') {
                    options.containerSettingShowFunction.call(self, settingForm, target, self);
                }
                settingForm.addClass('active');
            }

            sidebar.addClass('opened');
        }

        closeSidebar() {
            let self = this;
            let options = self.options;
            let sidebar = self.sidebar;
            let activeForm = sidebar.find('.keditor-sidebar-body').children('.active');

            if (activeForm.length > 0) {
                if (activeForm.is('.keditor-container-setting')) {
                    if (typeof options.containerSettingHideFunction === 'function') {
                        options.containerSettingHideFunction.call(self, activeForm, self);
                    }
                } else {
                    let activeType = activeForm.attr('data-type');
                    let componentData = KEditor.components[activeType];

                    if (typeof componentData.hideSettingForm === 'function') {
                        componentData.hideSettingForm.call(componentData, activeForm, self);
                    }
                }

                activeForm.removeClass('active');
            }

            self.setSettingComponent(null);
            self.setSettingContainer(null);
            sidebar.removeClass('opened');
        }

        // Legacy methods. DEPRECATED
        //---------------------------------
        showSettingPanel(target) {
            this.openSidebar(target);
        }

        hideSettingPanel() {
            this.closeSidebar();
        }

        // Snippet modal
        //---------------------------------
        initSnippetsModal() {
            let self = this;
            let options = self.options;
            let modalId = self.generateId('modal');

            let modal = self.modal = $(`
                <div class="keditor-ui keditor-modal" id="${modalId}">
                   <div class="keditor-modal-header">
                       <button type="button" class="keditor-modal-close">&times;</button>
                       <h4 class="keditor-modal-title"></h4>
                   </div>
                   <div class="keditor-modal-body">
                       <div class="keditor-snippets-wrapper keditor-snippets-wrapper-container">
                           <div class="keditor-snippets keditor-snippet-container"></div>
                       </div>
                       <div class="keditor-snippets-wrapper keditor-snippets-wrapper-component">
                           <div class="keditor-snippets keditor-snippet-component"></div>
                       </div>
                   </div>
                   <div class="keditor-modal-footer">
                       <button type="button" class="keditor-ui keditor-btn keditor-btn-default keditor-modal-close">Close</button>
                       <button type="button" class="keditor-ui keditor-btn keditor-btn-primary keditor-modal-add">Add</button>
                   </div>
                </div>
            `);

            if (typeof options.snippetsUrl === 'string' && options.snippetsUrl.length > 0) {
                flog(`Getting snippets form "${options.snippetsUrl}"...`);

                $.ajax({
                    type: 'get',
                    dataType: 'html',
                    url: options.snippetsUrl,
                    success: function (resp) {
                        flog('Success in getting snippets');

                        if (typeof options.onSnippetsLoaded === 'function') {
                            resp = options.onSnippetsLoaded.call(self, resp) || resp;
                        }

                        self.renderSnippets(resp);

                        if (options.snippetsFilterEnabled) {
                            self.initSnippetsFilter(true);
                            self.initSnippetsFilter();
                        }
                    },
                    error: function (jqXHR) {
                        flog('Error when getting snippets', jqXHR);
                        if (typeof options.onSnippetsError === 'function') {
                            options.onSnippetsError.call(self, jqXHR);
                        }
                    }
                });

                // Close buttons
                modal.find('.keditor-modal-close').on('click', function (e) {
                    e.preventDefault();

                    self.closeModal();
                });

                // Add button
                modal.find('.keditor-modal-add').on('click', function (e) {
                    e.preventDefault();

                    let selectedSnippet = modal.find('.keditor-snippets-wrapper .selected');
                    if (selectedSnippet.length === 0) {
                        return;
                    }

                    let contentArea = self.modalTarget.closest('.keditor-content-area');
                    let snippetType = selectedSnippet.attr('data-type');
                    let snippetContentElement = modal.find(selectedSnippet.attr('data-snippet'));
                    let snippetContent = snippetContentElement.html();

                    switch (self.modalAction) {
                        case MODAL_ACTION.ADD_COMPONENT:
                            let dataAttributes = self.getDataAttributes(snippetContentElement, null, true);
                            let newComponent = $(`
                                <section class="keditor-ui keditor-component" data-type="${snippetType}" ${dataAttributes.join(' ')}>
                                    <section class="keditor-ui keditor-component-content">${snippetContent}</section>
                                </section>
                            `);

                            self.modalTarget.append(newComponent);

                            let container = self.modalTarget.closest('.keditor-container');
                            if (typeof options.onComponentSnippetAdded === 'function') {
                                options.onComponentSnippetAdded.call(self, e, newComponent, selectedSnippet, contentArea);
                            }

                            self.initComponent(contentArea, container, newComponent);
                            break;

                        case MODAL_ACTION.ADD_CONTAINER:
                        case MODAL_ACTION.ADD_SUB_CONTAINER:
                            let newContainer = $(`
                                <section class="keditor-ui keditor-container showed-keditor-toolbar">
                                    <section class="keditor-ui keditor-container-inner">${snippetContent}</section>
                                </section>
                            `);

                            self.body.find('.keditor-container.showed-keditor-toolbar').removeClass('showed-keditor-toolbar');
                            self.modalTarget.append(newContainer);

                            if (typeof options.onContainerSnippetAdded === 'function') {
                                options.onContainerSnippetAdded.call(self, e, newContainer, selectedSnippet, contentArea);
                            }

                            self.initContainer(contentArea, newContainer);
                            break;

                        default:
                        // Do nothing
                    }

                    self.closeModal();
                });

                // Action click for snippet
                modal.on('click', '.keditor-snippet', function (e) {
                    e.preventDefault();

                    let snippet = $(this);
                    if (!snippet.hasClass('selected')) {
                        snippet.parent().find('.selected').removeClass('selected');
                        snippet.addClass('selected');
                    }
                });

                let cssTransitionEnd = 'webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend';
                modal.on(cssTransitionEnd, () => {
                    if (!modal.hasClass('showed')) {
                        modal.css('display', 'none');
                        $(document.body).removeClass('opened-modal');
                    }
                });

                modal.appendTo(document.body);
            } else {
                error('"snippetsUrl" must be not null!');
            }
        }

        renderSnippets(resp) {
            flog('renderSnippets');

            let self = this;
            let options = self.options;

            let snippetsContainerHtml = '';
            let snippetsComponentHtml = '';
            let snippetsContentHtml = '';

            self.snippetsContainerCategories = [];
            self.snippetsComponentCategories = [];

            $(resp).filter('div').each(function (i) {
                let snippet = $(this);
                let snippetId = self.generateId('snippet');
                let content = snippet.html().trim();
                let previewUrl = snippet.attr('data-preview');
                let type = snippet.attr('data-type');
                let title = snippet.attr('data-keditor-title');
                let categories = snippet.attr('data-keditor-categories') || '';

                let snippetHtml = `
                    <section
                        class="keditor-ui keditor-snippet"
                        data-snippet="#${snippetId}"
                        data-type="${type}"
                        title="${title}"
                        data-keditor-categories="${categories}"
                    >
                        <span><span style="background-image: url('${previewUrl}')"></span></span>   
                    </section>
                `;

                categories = categories.split(options.snippetsCategoriesSeparator);

                if (type === 'container') {
                    snippetsContainerHtml += snippetHtml;
                    self.snippetsContainerCategories = self.snippetsContainerCategories.concat(categories);
                } else if (type.indexOf('component') !== -1) {
                    snippetsComponentHtml += snippetHtml;
                    self.snippetsComponentCategories = self.snippetsComponentCategories.concat(categories);
                }

                let dataAttributes = self.getDataAttributes(snippet, ['data-preview', 'data-type', 'data-keditor-title', 'data-keditor-categories'], true);
                snippetsContentHtml += `<script id="${snippetId}" type="text/html" ${dataAttributes.join(' ')}>${content}</script>`;
            });

            self.snippetsContainerCategories = self.beautifyCategories(self.snippetsContainerCategories);
            self.snippetsComponentCategories = self.beautifyCategories(self.snippetsComponentCategories);

            self.modal.find('.keditor-snippet-container').html(snippetsContainerHtml);
            self.modal.find('.keditor-snippet-component').html(snippetsComponentHtml);
            self.modal.find('.keditor-modal-body').append(snippetsContentHtml);
        }

        initSnippetsFilter(isContainer) {
            flog(`initSnippetsFilter for ${isContainer ? 'container' : 'component'}`);

            let self = this;
            let options = self.options;
            let modal = self.modal;

            let categoriesOptions = '';
            $.each(isContainer ? self.snippetsContainerCategories : self.snippetsComponentCategories,
                function (i, category) {
                    categoriesOptions += `<option value="${category}">${category}</option>`;
                });

            let snippetsWrapper = modal.find(isContainer ? '.keditor-snippets-wrapper-container' : '.keditor-snippets-wrapper-component');
            let snippets = snippetsWrapper.find('.keditor-snippets').children('.keditor-snippet');

            snippetsWrapper.prepend(`
                <div class="keditor-ui keditor-snippets-filter-wrapper">
                    <select class="keditor-ui keditor-snippets-filter">
                        <option value="" selected="selected">All</option>
                        ${categoriesOptions}
                    </select>
                    <input type="text" class="keditor-ui keditor-snippets-search" value="" placeholder="Type to search..." />
                </div>                
            `);

            snippets.each(function () {
                let snippet = $(this);
                let categories = snippet.attr('data-keditor-categories') || '';
                let filterCategories = categories.toLowerCase();
                categories = categories.split(options.snippetsCategoriesSeparator);
                filterCategories = filterCategories.split(options.snippetsCategoriesSeparator);

                snippet.data('categories', categories);
                snippet.data('categoriesFilter', filterCategories);
            });

            let txtSearch = snippetsWrapper.find('.keditor-snippets-search');
            let cbbFilter = snippetsWrapper.find('.keditor-snippets-filter');

            let doFilter = function () {
                let selectedCategory = (cbbFilter.val() || '').toLowerCase();
                let searchText = (txtSearch.val() || '').toLowerCase();
                snippets.filter('.selected').removeClass('selected');

                if (selectedCategory || searchText) {
                    flog('Filtering snippets');

                    snippets.each(function () {
                        let snippet = $(this);
                        let dataCategories = snippet.data('categoriesFilter');
                        let dataCategoriesString = dataCategories.join(';');
                        let error = 0;

                        if (selectedCategory) {
                            if ($.inArray(selectedCategory, dataCategories) === -1) {
                                error++;
                            }
                        }

                        if (searchText) {
                            let title = snippet.attr('title').toLowerCase();
                            if (title.indexOf(searchText) === -1 && dataCategoriesString.indexOf(searchText) === -1) {
                                error++;
                            }
                        }

                        snippet[error === 0 ? 'removeClass' : 'addClass']('not-matched');
                    });
                } else {
                    flog('Show all snippets');
                    snippets.removeClass('not-matched');
                }
            };

            cbbFilter.on('change', function () {
                doFilter();
            });

            let timer;
            txtSearch.on('keydown', function () {
                clearTimeout(timer);
                timer = setTimeout(doFilter, 200);
            });
        }

        openModal(target, action) {
            let self = this;
            let modal = self.modal;
            let modalTitle = '';

            switch (action) {
                case MODAL_ACTION.ADD_CONTAINER:
                    modalTitle = 'Add container';
                    break;

                case MODAL_ACTION.ADD_SUB_CONTAINER:
                    modalTitle = 'Add sub-container';
                    break;

                case MODAL_ACTION.ADD_COMPONENT:
                    modalTitle = 'Add component';
                    break;

                default:
                // Do nothing
            }

            modal.find('.keditor-modal-title').html(modalTitle);
            modal.find('.keditor-snippets-wrapper').css('display', 'none');
            modal.find(action === MODAL_ACTION.ADD_COMPONENT ? '.keditor-snippets-wrapper-component' : '.keditor-snippets-wrapper-container').css('display', 'block');

            self.modalTarget = target;
            self.modalAction = action;

            modal.css('display', 'block');
            $(document.body).addClass('opened-modal');
            setTimeout(() => {
                modal.addClass('showed');
            }, 0);
        }

        closeModal() {
            let self = this;
            let modal = self.modal;

            self.modalTarget = null;
            self.modalAction = null;
            modal.find('.keditor-modal-title').html('');
            modal.find('.keditor-snippets-wrapper .selected').removeClass('selected');
            modal.removeClass('showed');
        }

        // Content areas
        //---------------------------------
        initContentAreas() {
            flog('initContentAreas');

            let self = this;
            let contentAreasWrapper = self.contentAreasWrapper;
            let options = self.options;

            let contentAreas;
            if (options.contentAreasSelector) {
                contentAreas = contentAreasWrapper.find(options.contentAreasSelector);
            }

            if (!contentAreas || contentAreas.length === 0) {
                flog('Do not find any content area. Creating default content area...');
                let originalContent = contentAreasWrapper.html();

                contentAreas = $('<div />').html(originalContent);
                contentAreasWrapper.empty().append(contentAreas);
            }

            contentAreas.each(function () {
                let contentArea = $(this);
                if (!contentArea.attr('id')) {
                    contentArea.attr('id', self.generateId('content-area'));
                }

                self.initContentArea(contentArea);
            });
        }

        initContentArea(contentArea, dontInitToolbar) {
            flog('initContentArea', contentArea);

            let self = this;
            let options = self.options;

            contentArea.addClass('keditor-content-area');

            if (typeof options.onBeforeInitContentArea === 'function') {
                options.onBeforeInitContentArea.call(self, contentArea);
            }

            if (!dontInitToolbar) {
                let contentAreaToolbar = $(self.generateToolbar(TOOLBAR_TYPE.CONTENT_AREA));
                contentArea.after(contentAreaToolbar);
                contentAreaToolbar.children('.btn-add-container').on('click', function (e) {
                    e.preventDefault();

                    self.openModal(contentArea, MODAL_ACTION.ADD_CONTAINER);
                });
            }

            flog('Initialize $.fn.sortable for content area');
            contentArea.sortable({
                handle: '.keditor-toolbar-container:not(.keditor-toolbar-sub-container) .btn-container-reposition',
                items: '> section',
                helper: 'clone',
                connectWith: '.keditor-content-area',
                axis: 'y',
                tolerance: 'pointer',
                sort: function () {
                    $(this).removeClass('ui-state-default');
                },
                receive: function (event, ui) {
                    flog('On received snippet', event, ui);

                    let helper = ui.helper;
                    let item = ui.item;

                    if (helper) {
                        helper.remove();
                    }

                    self.closeSidebar();

                    if (typeof options.onContentChanged === 'function') {
                        options.onContentChanged.call(self, event, contentArea);
                    }

                    item.addClass('keditor-ui-dragging');
                    contentArea.removeClass('keditor-highlighted-dropzone');
                },
                start: function (e, ui) {
                    ui.item.addClass('keditor-ui-dragging');
                },
                stop: function (e, ui) {
                    contentArea.removeClass('keditor-highlighted-dropzone');
                    if (ui.helper) {
                        ui.helper.remove();
                    }
                    ui.item.removeClass('keditor-ui-dragging');
                },
                over: function () {
                    contentArea.addClass('keditor-highlighted-dropzone');
                },
                out: function () {
                    contentArea.addClass('keditor-highlighted-dropzone');
                }
            });

            flog('Initialize existing containers in content area');
            contentArea.children('section').each(function () {
                self.convertToContainer(contentArea, $(this));
            });

            if (typeof options.onInitContentArea === 'function') {
                let contentData = options.onInitContentArea.call(self, contentArea);
                if (contentData && contentData.length > 0) {
                    $.each(contentData, function () {
                        self.convertToContainer(contentArea, $(this));
                    });
                }
            }
        }

        // Containers
        //---------------------------------
        convertToContainer(contentArea, target) {
            flog('convertToContainer', contentArea, target);

            let self = this;
            let container;

            if (target.is('section')) {
                target.addClass('keditor-ui keditor-container');
                target.wrapInner('<section class="keditor-ui keditor-container-inner"></section>');
                container = target;
            } else {
                target.wrap('<section class="keditor-ui keditor-container"><section class="keditor-ui keditor-container-inner"></section></section>');
                container = target.parent().parent();
            }

            self.initContainer(contentArea, container);
        }

        initContainer(contentArea, container) {
            let self = this;
            let options = self.options;
            let isNested = options.nestedContainerEnabled && container.closest('[data-type="container-content"]').length > 0;

            flog(`initContainer - isNested=${isNested}`, contentArea, container);

            if (!container.hasClass('keditor-initialized-container') || !container.hasClass('keditor-initializing-container')) {
                container.addClass('keditor-initializing-container');

                if (typeof options.onBeforeInitContainer === 'function') {
                    options.onBeforeInitContainer.call(self, container, contentArea);
                }

                if (isNested) {
                    container.addClass('keditor-sub-container');
                }

                flog('Render KEditor toolbar for container', container);
                container.append(self.generateToolbar(isNested ? TOOLBAR_TYPE.SUB_CONTAINER : TOOLBAR_TYPE.CONTAINER));

                container.attr('id', self.generateId(isNested ? 'sub-container' : 'container'));

                let containerContents = container.find('[data-type="container-content"]');
                flog(`Initialize ${containerContents.length} container content(s)`);
                containerContents.each(function () {
                    let containerContent = $(this);

                    if (options.nestedContainerEnabled && !isNested && containerContent.parents('[data-type="container-content"]').length > 0) {
                        // Do nothing because it's container content of sub container
                        return;
                    }

                    self.initContainerContent(contentArea, container, containerContent, isNested);
                });

                if (typeof options.onInitContainer === 'function') {
                    options.onInitContainer.call(self, container, contentArea);
                }

                container.addClass('keditor-initialized-container');
                container.removeClass('keditor-initializing-container');
            } else {
                if (container.hasClass('keditor-initialized-container')) {
                    flog('Container is already initialized!');
                } else {
                    flog('Container is initializing...');
                }
            }
        }

        initContainerContent(contentArea, container, containerContent, isNested) {
            flog(`initContainerContent - isNested=${isNested}`, contentArea, container, containerContent);

            let self = this;
            let options = self.options;

            containerContent.addClass('keditor-container-content');
            if (isNested) {
                containerContent.addClass('keditor-sub-container-content');
            }
            containerContent.attr('id', self.generateId('container-content'));

            let containerContentInner = $('<div class="keditor-container-content-inner"></div>');
            containerContentInner.html(containerContent.html());
            containerContent.html(containerContentInner);

            flog('Initialize toolbar for container content');
            let containerContentToolbar = $(self.generateToolbar(isNested ? TOOLBAR_TYPE.SUB_CONTAINER_CONTENT : TOOLBAR_TYPE.CONTAINER_CONTENT));
            containerContentToolbar.appendTo(containerContent);
            if (!isNested) {
                containerContentToolbar.children('.btn-add-container').on('click', function (e) {
                    e.preventDefault();

                    self.openModal(containerContentInner, MODAL_ACTION.ADD_SUB_CONTAINER);
                });
            }
            containerContentToolbar.children('.btn-add-component').on('click', function (e) {
                e.preventDefault();

                self.openModal(containerContentInner, MODAL_ACTION.ADD_COMPONENT);
            });

            flog('Initialize $.fn.sortable for container content');
            containerContentInner.sortable({
                handle: '.btn-component-reposition, .btn-container-reposition',
                helper: 'clone',
                items: '> section',
                connectWith: '.keditor-container-content-inner',
                tolerance: 'pointer',
                sort: function () {
                    $(this).removeClass('ui-state-default');
                },
                receive: function (event, ui) {
                    flog('On received snippet', event, ui);

                    let helper = ui.helper;
                    let item = ui.item;
                    let container;

                    if (helper) {
                        helper.remove();
                    }
                    container = item.closest('.keditor-container');

                    if (!container.hasClass('showed-keditor-toolbar')) {
                        $('.keditor-container.showed-keditor-toolbar').removeClass('showed-keditor-toolbar');
                        container.addClass('showed-keditor-toolbar');
                    }

                    if (typeof options.onContainerChanged === 'function') {
                        options.onContainerChanged.call(self, event, container, contentArea);
                    }

                    if (typeof options.onContentChanged === 'function') {
                        options.onContentChanged.call(self, event, contentArea);
                    }

                    item.removeClass('keditor-ui-dragging');
                    contentArea.removeClass('keditor-highlighted-dropzone');
                },
                start: function (e, ui) {
                    ui.item.addClass('keditor-ui-dragging');
                },
                stop: function (e, ui) {
                    containerContentInner.removeClass('keditor-highlighted-dropzone');

                    if (ui.helper) {
                        ui.helper.remove();
                    }
                    ui.item.removeClass('keditor-ui-dragging');
                },
                over: function () {
                    containerContentInner.addClass('keditor-highlighted-dropzone');
                },
                out: function () {
                    containerContentInner.removeClass('keditor-highlighted-dropzone');
                }
            });

            flog('Initialize existing components inside container content');
            containerContentInner.children().each(function () {
                let child = $(this);

                if (child.find('[data-type="container-content"]').length > 0) {
                    self.convertToContainer(contentArea, child);
                } else {
                    self.convertToComponent(contentArea, container, child, true);
                }
            });
        }

        // Components
        //---------------------------------
        convertToComponent(contentArea, container, target, isExisting) {
            flog('convertToComponent', contentArea, container, target, isExisting);

            if (target.is('.keditor-container-content-toolbar')) {
                return;
            }

            let self = this;
            let isSection = target.is('section');
            let component;

            if (isSection) {
                target.addClass('keditor-ui keditor-component');
                target.wrapInner('<section class="keditor-ui keditor-component-content"></section>');
                component = target;
            } else {
                target.wrap('<section class="keditor-ui keditor-component"><section class="keditor-ui keditor-component-content"></section></section>');
                component = target.parent().parent();
            }

            if (isExisting) {
                component.addClass('existing-component');
            }

            self.initComponent(contentArea, container, component);
        }

        initComponent(contentArea, container, component) {
            flog('initComponent', contentArea, container, component);

            let self = this;
            let options = self.options;
            let body = self.body;

            if (!component.hasClass('keditor-initialized-component') || !component.hasClass('keditor-initializing-component')) {
                component.addClass('keditor-initializing-component');
                component.attr('id', self.generateId('component'));

                if (typeof options.onBeforeInitComponent === 'function') {
                    options.onBeforeInitComponent.call(self, component, contentArea);
                }

                let componentContent = component.children('.keditor-component-content');
                componentContent.attr('id', self.generateId('component-content'));

                let componentType = self.getComponentType(component);
                flog(`Component type: ${componentType}`);

                let componentData = KEditor.components[componentType];

                flog('Render KEditor toolbar for component', component);
                component.append(self.generateToolbar(TOOLBAR_TYPE.COMPONENT, componentData.settingEnabled));

                component.find('[data-dynamic-href]').each(function () {
                    let dynamicElement = $(this);

                    self.initDynamicContent(dynamicElement);
                });

                if (typeof componentData.init === 'function') {
                    componentData.init.call(componentData, contentArea, container, component, self);
                } else {
                    flog(`"init" function of component type "${componentType}" does not exist`);
                }

                if (typeof options.onInitComponent === 'function') {
                    options.onInitComponent.call(self, component, contentArea);
                }

                component.addClass('keditor-initialized-component');
                component.removeClass('keditor-initializing-component');
            } else {
                if (component.hasClass('keditor-initialized-component')) {
                    flog('Component is already initialized!');
                } else {
                    flog('Component is initializing...');
                }
            }
        }

        initDynamicContent(dynamicElement) {
            flog('initDynamicContent', dynamicElement);

            let self = this;
            let options = self.options;
            let component = dynamicElement.closest('.keditor-component');
            let contentArea = dynamicElement.closest('.keditor-content-area');

            dynamicElement.attr('id', self.generateId('dynamic-element'));

            if (typeof options.onBeforeDynamicContentLoad === 'function') {
                options.onBeforeDynamicContentLoad.call(self, dynamicElement, component, contentArea);
            }

            let dynamicHref = dynamicElement.attr('data-dynamic-href');
            let data = self.getDataAttributes(component, ['data-type', 'data-dynamic-href'], false);
            data = $.param(data);
            flog(`Dynamic href: ${dynamicHref}, Data: ${data}`);

            return $.ajax({
                url: dynamicHref,
                data: data,
                type: 'GET',
                dataType: 'HTML',
                success: function (response, status, xhr) {
                    flog('Dynamic content is loaded', dynamicElement, response, status, xhr);
                    dynamicElement.html(response);

                    if (typeof options.onDynamicContentLoaded === 'function') {
                        options.onDynamicContentLoaded.call(self, dynamicElement, response, status, xhr, contentArea);
                    }
                },
                error: function (response, status, xhr) {
                    flog('Error when loading dynamic content', dynamicElement, response, status, xhr);

                    if (typeof options.onDynamicContentError === 'function') {
                        options.onDynamicContentError.call(self, dynamicElement, response, status, xhr, contentArea);
                    }
                }
            });
        }

        deleteComponent(component) {
            flog('deleteComponent', component);

            let self = this;

            let componentType = self.getComponentType(component);
            let componentData = KEditor.components[componentType];
            if (typeof componentData.destroy === 'function') {
                componentData.destroy.call(componentData, component, self);
            }

            component.remove();
        }

        // Get content
        //---------------------------------
        getComponentContent(component) {
            flog('getComponentContent');

            let self = this;
            let clonedComponent = component.clone();
            let componentType = self.getComponentType(clonedComponent);
            let componentData = KEditor.components[componentType];
            let dataAttributes = self.getDataAttributes(clonedComponent, null, true);
            let content;

            if (typeof componentData.getContent === 'function') {
                content = componentData.getContent.call(componentData, clonedComponent, self);
            } else {
                let componentContent = clonedComponent.children('.keditor-component-content');
                content = componentContent.html();
            }

            clonedComponent.html(content).find('[data-dynamic-href]').each(function () {
                $(this).html('');
            });

            return `<section ${dataAttributes.join(' ')}>${clonedComponent.html()}</section>`;
        }

        getContainerContent(container, isNested) {
            flog(`getContainerContent - isNested=${isNested}`, container);

            let self = this;
            let containerInner = container.children('.keditor-container-inner').clone();

            containerInner.find('[data-type=container-content]').not(isNested ? '' : '.keditor-sub-container-content').each(function () {
                let containerContent = $(this);
                containerContent.removeClass('keditor-container-content keditor-sub-container-content').removeAttr('id');

                let containerContentInner = containerContent.children();
                let content = '';

                containerContentInner.children().each(function () {
                    let child = $(this);

                    if (child.is('.keditor-component')) {
                        content += self.getComponentContent(child);
                    } else if (child.is('.keditor-sub-container')) {
                        content += self.getContainerContent(child, true);
                    }
                });

                containerContent.html(content);
            });

            return `<section>${containerInner.html()}</section>`;
        }

        getContent(inArray) {
            let self = this;
            let result = [];

            self.contentAreasWrapper.find('.keditor-content-area').each(function () {
                let html = '';
                $(this).children('.keditor-container').each(function () {
                    let container = $(this);

                    html += self.getContainerContent(container);
                });

                result.push(html);
            });

            return inArray ? result : result.join('\n');
        }

        // Set content
        //---------------------------------
        setContent(content, contentArea) {
            let self = this;
            let contentAreasWrapper = self.contentAreasWrapper;

            if (!contentArea) {
                contentArea = contentAreasWrapper.children('.keditor-content-area');
            } else {
                if (!contentArea.jquery) {
                    contentArea = contentAreasWrapper.find(contentArea);
                }
            }

            if (contentArea.length === 0) {
                error('Content area does not exist!');
            }

            contentArea.html(content);
            self.initContentArea(contentArea, true);
        }

        // Destroy
        //---------------------------------
        destroy() {
            let self = this;
            let element = self.element;
            let id = self.id;

            let content = self.getContent(false);

            if (self.options.iframeMode) {
                self.iframeWrapper.remove();
            } else {
                self.contentAreasWrapper.remove();
            }

            if (element.is('textarea')) {
                element.val(content);
            } else {
                element.html(content);
            }

            element.removeClass('keditor-hidden-element');
            element.data('keditor', null);
            delete KEditor.instances[id];
        }
    }

    // KEditor plugins
    $.fn.keditor = function (options) {
        let element = $(this);
        let instance = element.data('keditor');

        if (typeof options === 'string') {
            if (instance && instance[options] && typeof instance[options] === 'function') {
                return instance[options].apply(instance, Array.prototype.slice.call(arguments, 1));
            }
        } else {
            if (!instance) {
                instance = new KEditor(element, options);
                element.data('keditor', instance);
            }

            return instance;
        }
    };
    $.fn.keditor.constructor = KEditor;

    // KEditor instances
    KEditor.instances = {};

    // Turn on/off debug mode
    KEditor.debug = false;

    // Version of KEditor
    KEditor.version = '@{version}';

    // Component types
    KEditor.components = {
        blank: {
            settingEnabled: false
        }
    };

    // Export default configuration
    KEditor.DEFAULTS = DEFAULTS;

    // Export log methods;
    KEditor.log = flog;
    KEditor.error = error;

    // Export KEditor
    window.KEditor = $.keditor = KEditor;

})(window, jQuery);
