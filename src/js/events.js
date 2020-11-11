

const Uuid = function() {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
		var r = Math.random() * 16 | 0, v = c == "x" ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
};


const eventHandler =function (eventNames) {
	if (Array.isArray(eventNames)) {

		var observers = [];

		eventNames.forEach(function (obj) {
			observers[obj] = [];
		});

		var subscribe = function (name, callBack) {
            var eventid = Uuid();

			if (observers[name])
            {    observers[name][eventid] = callBack;
                  return eventid;
            }
                

		}

		var unsubscribe = function (name,handle) {
            if(!handle)
            {
              Object.keys(observers[name]).forEach(handle =>observers[name][handle] = null )
            }
            else
            {
                if (observers[name]) {
                    try {
                        observers[name][handle] = null;
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
         
		}

		var dispatchEvent = function (name, args) {
			if (observers[name]) {
				trigger(observers[name], args);
			}
		}

		var trigger = function (callbackArray, args) {
			for (var i = 0; i < Object.keys(callbackArray).length; i++) {
                var key = Object.keys(callbackArray)[i];
                if(	callbackArray[key] !== null)
                {
                    callbackArray[key](args);
                }
			
			}
		}

		return {
			on: subscribe,
			off: unsubscribe,
			dispatchEvent: dispatchEvent
		}
	} else
		console.error("observers parametresi bir dizi olmalı");

};



export  {
    eventHandler
}
