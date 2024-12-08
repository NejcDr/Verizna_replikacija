package main

import(
	"fmt"
	"flag"
	"os"
	"bufio"
	"strings"
	"strconv"
)

var ORIGINAL_NUM_SERVERS int
var NUM_SERVERS int
var PING_WAIT int
var BURST_SIZE int

var COMMAND_CHAN chan Command
var CLOCK_CHAN chan int

var SERVERS []ServerConf
var INIT_SETUP []Value

var RESET_MAIN chan int
var RESET_CONTROL chan int
var RESET_SERVERS chan int

func initServers() []ServerConf {
	put_chans := make([]chan Value, NUM_SERVERS + 1)
	commit_chans := make([]chan Value, NUM_SERVERS + 1)
	get_input_chans := make([]chan Command, NUM_SERVERS)

	for i := 0; i < NUM_SERVERS; i++ {
		put_chans[i] = make(chan Value, 10)
		commit_chans[i] = make(chan Value, 10)
		get_input_chans[i] = make(chan Command, 10)
	}

	COMMAND_CHAN = make(chan Command, 100)
	CLOCK_CHAN = make(chan int, 1)

	put_chans[NUM_SERVERS] = nil
	commit_chans[NUM_SERVERS] = nil
	tail_get_chan := get_input_chans[NUM_SERVERS - 1]

	servers := make([]ServerConf, NUM_SERVERS)
	for i := 0; i < NUM_SERVERS; i++ {
		head_flag := i == 0
		tail_flag := i == NUM_SERVERS - 1

		serverInit := ServerConf{
			Id: i, 
			Storage: make(map[string]Value),
			Head_flag: head_flag, 
			Tail_flag: tail_flag,
			Tail_sync_flag: false,
			PUT_CHANS: Dual_Value{Input: put_chans[i], Output: put_chans[i+1]},
			COMMIT_CHANS: Dual_Value{Input: commit_chans[i+1], Output: commit_chans[i]},
			GET_CHANS: Dual_Command{Input: get_input_chans[i], Output: nil},
			CLOCK_SERVER_CHAN: make(chan int, 1), 
			CLOCK_CONTROL_CHAN: make(chan int, 1),
			TAIL_CHANS: Dual_Command{Input: tail_get_chan, Output: make(chan Command, 10)},
			PING_CHANS: Dual_Int{Input: make(chan int), Output: make(chan int)}, 
			SHUTDOWN_CHAN: make(chan int), 
			SERVICE_CHAN: make(chan ServerConf),
			TAIL_CONFIRM_CHAN: make(chan int),
			Sync_recived_flag: false,
			Sync_done_flag: false,
			Sync_Storage: make([] Value, 0)}
		servers[i] = serverInit
	}

	return servers
}

func initConfigurationFile(confInit string) []Value {
	var init []Value

	if confInit != "" {
		confFile, err := os.Open(confInit)
		if err != nil {
			fmt.Println("Error:", err)
		}

		scanner := bufio.NewScanner(confFile)
		for scanner.Scan() {
			line := scanner.Text()
			substring := strings.Split(line, "|")

			key := strings.TrimSpace(substring[0])
			value := strings.TrimSpace(substring[1])
			version, _ := strconv.Atoi(strings.TrimSpace(substring[2]))
			user := strings.TrimSpace(substring[3])
			insert := Value{Key: key, Value: value, Version: version, User: user}
			init = append(init, insert)
		}
		confFile.Close()
	}

	return init
}

func startSimulation() {
	go ServersInit()
	go ControlInit()
}

func main() {
	var confInit string
	flag.IntVar(&ORIGINAL_NUM_SERVERS, "n", 5, "Defines initial number of servers in chain.")
	flag.StringVar(&confInit, "f", "", "File with initial storage. File must be .txt. Each line represents one value like: key | value | version | user")
	flag.Parse()

	if ORIGINAL_NUM_SERVERS < 1 && ORIGINAL_NUM_SERVERS > 7 {
		fmt.Println("Error: Number of servers must be at least 1 and at most 7.")
	}

	NUM_SERVERS = ORIGINAL_NUM_SERVERS
	PING_WAIT = 5
	BURST_SIZE = 1
	SERVERS = initServers()
	INIT_SETUP = initConfigurationFile(confInit)
	RESET_MAIN = make(chan int)
	RESET_CONTROL = make(chan int)
	RESET_SERVERS = make(chan int)

	startSimulation()
	go RestInit()

	for {
		select {
		case <-RESET_MAIN:
			RESET_CONTROL <- 1
			RESET_SERVERS <- 1
			NUM_SERVERS = ORIGINAL_NUM_SERVERS
			SERVERS = initServers()
			startSimulation()
		default:
			continue
		}
	}
}