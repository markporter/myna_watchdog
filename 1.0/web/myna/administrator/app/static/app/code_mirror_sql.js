
/* Register sql_autocomplete */
    CodeMirror.commands.sql_autocomplete = function(editor) {

        // We want a single cursor position.
        if (editor.somethingSelected()) return;

        var cur = editor.getCursor();
        var alias = editor.getTokenAt(editor.getCursor());
        var table_name = alias.string;
        
        
        
        function insert(str) {
            //editor.replaceSelection(str, result.from, result.to);
            editor.replaceSelection(str);
            window.setTimeout(function(){
                editor.setSelection(
                    editor.getCursor(false),
                    editor.getCursor(false)
                );
                editor.focus();
            });
        }
        insert(".");
        var matches = editor.getValue().match(r =new RegExp("(\\w+)\\s+" + alias.string+"\\s","im"));
        if (matches){
            table_name = matches[1];
        }
        console.log(r,table_name)
   
        
        var m = Ext.create('Ext.menu.Menu', {
            plain:true,
            items:[{
                xtype:"combo",
                //values:completions,
                enableKeyEvents:true,
                typeAhead:true,
                queryMode:"remote",
                displayField:'text',
                valueField:'text',
                store:{
                    autoLoad:true,
                    proxy:{
                        type: 'direct',

                        directFn:$FP.DbManager.getTreeNode,
                        paramsAsHash:true,
                        extraParams:{
                            ds:appVars.ds_name,
                            node:"table:"+table_name
                        },
                        reader: {
                            type: 'json'
                        }
                    },
                    fields:[
                        {name:'text'}
                    ]
                    
                },
                listeners:{
                    afterrender:function (c) {
                        window.setTimeout(function () {c.doQuery("",true);c.focus();},100);
                    },
                    select:function (c,r) {
                        insert(r.first().get("text"));
                        c.ownerCt.hide();
                    },
                    specialKey:function (c,e) {
                        if (e.getKey() == e.ESC) c.ownerCt.hide();
                    }
                }
            }],
            listeners:{

                hide:function (panel) {
                    window.setTimeout(function(){
                        editor.setSelection(
                            editor.getCursor(false),
                            editor.getCursor(false)
                        );
                        editor.focus();
                    });
                }
            }
        });
        
        var coords=editor.cursorCoords(true, "page");
        m.showAt([coords.left,coords.bottom+3]);
        /*window.setTimeout(function(){
            editor.setSelection(
                editor.getCursor(false),
                editor.getCursor(false)
            );
            editor.focus();
        },50);*/

        return true;
    }
