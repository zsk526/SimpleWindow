// 事件绑定
var Util = {
    
    event : {

        on: function(element, type, handler) {
            if(element.addEventListener) {
                element.addEventListener(type, handler, false);
            } else if (element.attachEvent) {
                element.attachEvent("on"+type,handler);
            } else {
                element["on"+type] = handler;
            }
        },

        off: function(element, type, handler) {
            if(element.removeEventListener) {
                element.removeEventListener(type, handler, false);
            } else if (element.detachEvent) {
                element.detachEvent("on"+type,handler);
            } else {
                element["on"+type] = null;
            }
        },

        getEvent: function(event){
            return event ? event : window.event;
        },

        getPageAxis: function(event) {

            if(event.pageX || event.pageY){
                return {
                    x : event.pageX,
                    y : event.pageY
                }
            }

            var doc = document.documentElement;
            var body = document.body;

            return {
                x : event.clientX +
                    ( doc && doc.scrollLeft || body && body.scrollLeft || 0 ) -
                    ( doc && doc.clientLeft || body && body.clientLeft || 0 ),
                y : event.clientY +
                    ( doc && doc.scrollTop  || body && body.scrollTop  || 0 ) -
                    ( doc && doc.clientTop  || body && body.clientTop  || 0 )
            }
        }
    },

    getId : function (id) {
        return document.getElementById(id);
    }
};






function SimpleWindow(opts) {
    this.options = opts;

    this.winParent = opts.parent || document.body;

    this._create(opts.width, opts.height);
}


SimpleWindow.prototype = {

    // 创建窗口元素 并添加到页面
    _create : function(width, height) {
        var winElement = this.winElement = document.createElement('div');
        winElement.className = "simple-window";
        winElement.style.width = width + "px";
        winElement.style.height = height + "px";

        var winContainer = this.winContainer = document.createElement('div');
        winContainer.className = "simple-window-container";
        winElement.appendChild(winContainer);

        var winHeader = this.winHeader = document.createElement('div');
        winHeader.className = "simple-window-header";
        winContainer.appendChild(winHeader);

        var winContent = this.winContent = document.createElement('div');
        winContent.className = "simple-window-content";
        winContainer.appendChild(winContent);

        var winFooter = this.winFooter = document.createElement('div');
        winFooter.className = "simple-window-footer";
        winContainer.appendChild(winFooter);

        // 设置位置
        this.moveTo(this.options.top || 0, this.options.left || 0);

        // 添加到页面
        this.winParent.appendChild(winElement);

        // 绑定拖动事件
        this._drag(winElement, winHeader);

        // 绑定缩小放大事件
        this._bindResize();

    },

    // 移动窗口位置
    moveTo : function(left, top) {
        var winStyle = this.winElement.style;
        winStyle.left = left + "px";
        winStyle.top = top + "px";
    },

    // 绑定拖动功能
    _drag : function(ele, handler) {

        var _self = this;

        // 鼠标起始位置
        var preMouse = {
            x : null,
            y : null
        }

        // 窗口原始位置
        var prePosition = {
            top : null,
            left : null
        }

        // 窗口大小
        var positionRange = {
            minTop : 0,
            minLeft : 0,
            maxTop : ele.offsetParent.clientHeight - ele.offsetHeight,
            maxLeft : ele.offsetParent.clientWidth - ele.offsetWidth
        }


        // 拖动绑定
        function mouseDown(event) {
            
            event = Util.event.getEvent(event);

            preMouse = Util.event.getPageAxis(event);

            prePosition = {
                top : ele.offsetTop,
                left : ele.offsetLeft
            }

            positionRange.maxTop = ele.offsetParent.clientHeight - ele.offsetHeight;
            positionRange.maxLeft = ele.offsetParent.clientWidth - ele.offsetWidth;

            Util.event.on(document, 'mousemove', mouseMove);
            Util.event.on(document, 'mouseup', mouseUp);
        }

        // 拖动功能
        function mouseMove(event) {
            var currentAxis = Util.event.getPageAxis(event);
            var changedAxis = {
                x : currentAxis.x - preMouse.x,
                y : currentAxis.y - preMouse.y
            }

            var resultX = prePosition.left + changedAxis.x;
            var resultY = prePosition.top + changedAxis.y;

            // 超出范围判断
            resultX = resultX <= positionRange.minLeft ? positionRange.minLeft : resultX;
            resultX = resultX >= positionRange.maxLeft ? positionRange.maxLeft : resultX;

            resultY = resultY <= positionRange.minTop ? positionRange.minTop : resultY;
            resultY = resultY >= positionRange.maxTop ? positionRange.maxTop : resultY;


            _self.moveTo(resultX, resultY)
        }

        // 解绑拖动
        function mouseUp(evetn) {

            Util.event.off(document, 'mousemove', mouseMove);
            Util.event.off(document, 'mouseup', mouseUp);
        }

        Util.event.on(handler, 'mousedown', mouseDown);
    },

    resizeTo : function(width, height) {
        var winStyle = this.winElement.style;
        winStyle.width = width + "px";
        winStyle.height = height + "px";
    },


    _bindResize : function() {
        var _self = this;
        var winElement = this.winElement;

        // 鼠标起始位置
        var preMouse = {
            x : null,
            y : null
        }

        // 窗口原始位置
        var prePosition = {
            left : null,
            top : null
        }

        // 窗口原始大小
        var preSize = {
            width : null,
            height : null
        }

        // 可改变的值
        var changeParam = {
            top : false,
            left : false,
            width : false,
            left : false
        }

        Util.event.on(winElement, 'mousemove', setCursor);

        // 设置鼠标样式
        function setCursor(event) {

            if(_self.resizing){return false};

            _self.resizeAble = true;

            event = Util.event.getEvent(event);

            var cursor = "default";

            var clientRect = _self.winElement.getBoundingClientRect();

            var offsetWdith = clientRect.right - clientRect.left,
                offsetHeight = clientRect.bottom - clientRect.top;

            var x = event.clientX - clientRect.left + (offsetWdith - _self.winElement.clientWidth)/2, 
                y = event.clientY - clientRect.top + (offsetHeight - _self.winElement.clientHeight)/2;

            changeParam.width = changeParam.height = changeParam.top = changeParam.left = false;

            if(x >= 0 && x <= 10){
                cursor = "ew-resize";
                changeParam.width = changeParam.left = true;
                if(y >= 0 && y <= 10){
                    cursor = "nwse-resize";
                    changeParam.height = changeParam.top = true;
                }else if(y >= offsetHeight - 10){
                    cursor = "nesw-resize";
                    changeParam.height = true;
                }
            }else if(x >= offsetWdith - 10){
                cursor = "ew-resize";
                changeParam.width = true;
                if(y >= 0 && y <= 10){
                    cursor = "nesw-resize";
                    changeParam.height = changeParam.top = true;
                }else if(y >= offsetHeight - 10){
                    cursor = "nwse-resize";
                    changeParam.height = true;
                }
            }else if(y >= 0 && y <= 10){
                cursor = "ns-resize";
                changeParam.height = changeParam.top = true;
            }else if(y >= offsetHeight - 10){
                cursor = "ns-resize";
                changeParam.height = true;
            }else{
                cursor = "default";
                _self.resizeAble = false;
            }

            winElement.style.cursor = cursor;
        }

        // 绑定缩小放大功能
        Util.event.on(winElement, 'mousedown', resizeMouseDown);

        function resizeMouseDown(event) {
            if(_self.resizeAble){
                _self.resizing = true;
                preMouse = Util.event.getPageAxis(event);

                preSize = {
                    width : parseInt(_self.winElement.style.width),
                    height : parseInt(_self.winElement.style.height)
                }

                prePosition = {
                    top : _self.winElement.offsetTop,
                    left : _self.winElement.offsetLeft
                }

                Util.event.on(document, 'mousemove', resizeMouseMove);
                Util.event.on(document, 'mouseup', resizeMouseUp);
            }
        }

        function resizeMouseMove(event) {
            event = Util.event.getEvent(event);
            var currentAxis = Util.event.getPageAxis(event);
            var changedAxis = {
                x : currentAxis.x - preMouse.x,
                y : currentAxis.y - preMouse.y
            }

            var left = prePosition.left, 
                top = prePosition.top, 
                width = preSize.width, 
                height = preSize.height;


            if(changeParam.width){
                if(changeParam.left){
                    width = preSize.width - changedAxis.x;
                }else{
                    width = preSize.width + changedAxis.x;
                }
            }

            if(changeParam.height){
                if(changeParam.top){
                    height = preSize.height - changedAxis.y;
                }else{
                    height = preSize.height + changedAxis.y;
                }
            }

            if(changeParam.left){
                left = prePosition.left + changedAxis.x;
            }

            if(changeParam.top){
                top = prePosition.top + changedAxis.y;
            }


            _self.moveTo(left, top);

            _self.resizeTo(width, height);
        }

        function resizeMouseUp(event) {
            if(_self.resizeAble){
                _self.resizing = false;
                Util.event.off(document, 'mousemove', resizeMouseMove);
                Util.event.off(document, 'mouseup', resizeMouseUp);
            }
        }
    }




}

var win01 = new SimpleWindow({
    parent : Util.getId('wrapper'),

    width : 300,
    height : 300,
    top : 80,
    left : 100,

    title : "标题",
    content : "内容",
    footer : "状态栏"
});


var win02 = new SimpleWindow({
    parent : Util.getId('wrapper'),

    width : 200,
    height : 200,
    top : 250,
    left : 250,

    title : "标题",
    content : "内容",
    footer : "状态栏"
});










