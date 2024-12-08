package main

import(
	"fmt"
	"encoding/json"
    "log"
    "net/http"
	"time"

	"github.com/rs/cors"
)

func sendEvents(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/event-stream")
    w.Header().Set("Cache-Control", "no-cache")
    w.Header().Set("Connection", "keep-alive")

	flusher, ok := w.(http.Flusher)
    if !ok {
        http.Error(w, "Streaming unsupported!", http.StatusInternalServerError)
        return
    }

	for {
		select {
		case timeClock, ok := <-CLOCK_CHAN:
			if ok {
				time.Sleep(100 * time.Millisecond)
				commands := []Command{}
				empty := false

				fmt.Printf("Sending events: %d\n", timeClock)

				for {
					select {
					case cmd, ok := <-COMMAND_CHAN:
						if ok {
							commands = append(commands, cmd)
							fmt.Printf("Received command: %v\n", cmd)
						} else {
							empty = true
						}
					default:
						empty = true
					}
					
					if empty {
						break
					}
				}

				events := Events{Time: timeClock, Events: commands}
				data, err := json.Marshal(events)
				if err != nil {
					http.Error(w, "Failed to encode JSON", http.StatusInternalServerError)
					return
				}

				msg := fmt.Sprintf("data: %s\n\n", data)
				fmt.Fprintf(w, msg)
				flusher.Flush()
			}
		}
	}
}

func clock(w http.ResponseWriter, r *http.Request) {
	SendClockSignal()
	w.WriteHeader(http.StatusOK)
}

func input(w http.ResponseWriter, r *http.Request) {
	newValue := Value{}

	err := json.NewDecoder(r.Body).Decode(&newValue)
    if err != nil {
        http.Error(w, "Bad request", http.StatusBadRequest)
        return
    }

    SERVERS[0].PUT_CHANS.Input <- newValue

    w.WriteHeader(http.StatusOK)
}

func read(w http.ResponseWriter, r *http.Request) {
	newRead := Read{}

	err := json.NewDecoder(r.Body).Decode(&newRead)
    if err != nil {
        http.Error(w, "Bad request", http.StatusBadRequest)
        return
    }

	cmd := Command{}
	cmd.Command = "get"
	cmd.Server = newRead.Server

	if (newRead.Key == "") {
		cmd.Arguments = []string{}
	} else {
		cmd.Arguments = []string{newRead.Key}
	}

	server, index := FindServer(newRead.Server)
	if index != -1 {
		server.GET_CHANS.Input <- cmd
	}

	w.WriteHeader(http.StatusOK)
}

func config(w http.ResponseWriter, r *http.Request) {
	configuration := Configuration{NServers: NUM_SERVERS, Init: INIT_SETUP}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(configuration)
}

func reset(w http.ResponseWriter, r *http.Request) {
	RESET_MAIN <- 1
	w.WriteHeader(http.StatusOK)
}

func add(w http.ResponseWriter, r *http.Request) {
	ServerAdd()
	w.WriteHeader(http.StatusOK)
}

func shutdown(w http.ResponseWriter, r *http.Request) {
	newRead := Read{}

	err := json.NewDecoder(r.Body).Decode(&newRead)
    if err != nil {
        http.Error(w, "Bad request", http.StatusBadRequest)
        return
    }

	server, index := FindServer(newRead.Server)
	if index != -1 {
		server.SHUTDOWN_CHAN <- 1
	}

	w.WriteHeader(http.StatusOK)
}

func RestInit() {
	mux := http.NewServeMux()
	mux.HandleFunc("/events", sendEvents)
	mux.HandleFunc("/clock", clock)
	mux.HandleFunc("/input", input)
	mux.HandleFunc("/read", read)
	mux.HandleFunc("/config", config)
	mux.HandleFunc("/reset", reset)
	mux.HandleFunc("/add", add)
	mux.HandleFunc("/shutdown", shutdown)

	handler := cors.Default().Handler(mux)

	log.Println("Starting server on :8080")
    err := http.ListenAndServe(":8080", handler)
    if err != nil {
        log.Fatalf("ListenAndServe: %v", err)
    }
}