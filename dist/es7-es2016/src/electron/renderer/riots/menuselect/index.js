riot.tag2('riot-menuselect', '<select class="mdc-select__native-control"> <option each="{opts.options}" riot-value="{label}" id="{id}" selected="{id === parent.opts.selected}" disabled="{label === \'_\'}">{(label === ⁗_⁗ ? ⁗⁗ : label)}</option> </select> <label class="mdc-floating-label mdc-floating-label--float-above">{opts.label}</label> <div class="mdc-line-ripple"></div>', '', 'class="mdc-select"', function(opts) {
window.riot_menuselect.call(this, this.opts);
});
