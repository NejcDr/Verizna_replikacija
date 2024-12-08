package main

import(
	"fmt"
)

var NEXT_ID int
var TIME int
var TMP_CLOCK_CHAN chan int
var TMP_CLOCK_ON bool

func SendClockSignal() {
	for i := 0; i < NUM_SERVERS; i++ {
		select {
		case SERVERS[i].CLOCK_SERVER_CHAN <- TIME:
		default:
			fmt.Printf("Failed to send clock signal to CLOCK_SERVER_CHAN of server %d\n", SERVERS[i].Id)
		}
		select {
		case SERVERS[i].CLOCK_CONTROL_CHAN <- TIME:
		default:
			fmt.Printf("Failed to send clock signal to CLOCK_CONTROL_CHAN of server %d\n", SERVERS[i].Id)
		}
	}
	
	select {
	case CLOCK_CHAN <- TIME:
	default:
		fmt.Println("Failed to send clock signal to global CLOCK_CHAN")
	}

	if TMP_CLOCK_ON {
		select {
		case TMP_CLOCK_CHAN <- TIME:
		default:
			fmt.Println("Failed to send clock signal to TMP_CLOCK_CHAN")
		}
	}

    TIME++
}

func FindServer(id int) (ServerConf, int) {
	for index, server := range SERVERS {
		if server.Id == id {
			return server, index
		}
	}

	return ServerConf{}, -1
}

func chanChange(input chan Value, output chan Value) {
	for {
		select {
		case value, _ := <-input:
			output <- value
		default:
			return
		}
	}
}

func ServerAdd() {
	var tail_old ServerConf
	var tail_new ServerConf

	tail_old = SERVERS[NUM_SERVERS-1]

	tail_new = ServerConf{
		Id: NEXT_ID, 
		Storage: make(map[string]Value),
		Head_flag: false, 
		Tail_flag: true,
		Tail_sync_flag: true,
		PUT_CHANS: Dual_Value{Input: make(chan Value, 10), Output: nil},
		COMMIT_CHANS: Dual_Value{Input: nil, Output: make(chan Value, 10)},
		GET_CHANS: Dual_Command{Input: make(chan Command, 10), Output: make(chan Command, 10)},
		CLOCK_SERVER_CHAN: make(chan int, 1), 
		CLOCK_CONTROL_CHAN: make(chan int, 1),
		TAIL_CHANS: Dual_Command{Input: nil, Output: nil},
		PING_CHANS: Dual_Int{Input: make(chan int), Output: make(chan int)}, 
		SHUTDOWN_CHAN: make(chan int), 
		SERVICE_CHAN: make(chan ServerConf),
		TAIL_CONFIRM_CHAN: make(chan int),
		Sync_recived_flag: false,
		Sync_done_flag: false,
		Sync_Storage: make([] Value, 0)}

	SERVERS = append(SERVERS, tail_new)
	NEXT_ID++
	NUM_SERVERS++

	go Server(tail_new)
    go Ping(tail_new)

	tail_old.Tail_sync_flag = true
	tail_old.PUT_CHANS.Output = tail_new.PUT_CHANS.Input
	tail_old.COMMIT_CHANS.Input = tail_new.COMMIT_CHANS.Output

	_, indexOld := FindServer(tail_old.Id)
	SERVERS[indexOld] = tail_old
	tail_old.SERVICE_CHAN <- tail_old
	COMMAND_CHAN <- Command{Command: "send_change_config(Sync_new_tail)", Server: tail_old.Id}

	<-tail_old.TAIL_CONFIRM_CHAN
	<-tail_new.TAIL_CONFIRM_CHAN

	tail_new.Tail_sync_flag = false
	tail_new.GET_CHANS.Input = tail_old.GET_CHANS.Input
	tail_new.TAIL_CHANS.Input = tail_old.GET_CHANS.Input
	_, indexNew := FindServer(tail_new.Id)
	SERVERS[indexNew] = tail_new

	tail_old.Tail_flag = false
	tail_old.Tail_sync_flag = false
	tail_old.TAIL_CHANS.Input = tail_new.GET_CHANS.Input
	tail_old.TAIL_CHANS.Output = make(chan Command, 10)
	tail_old.GET_CHANS.Input = make(chan Command, 10)
	SERVERS[indexOld] = tail_old

	TMP_CLOCK_ON = true
	<-TMP_CLOCK_CHAN
	TMP_CLOCK_ON = false

	tail_old.SERVICE_CHAN <- tail_old
	COMMAND_CHAN <- Command{Command: "send_change_config(Confirm_new_tail)", Server: tail_old.Id}

	tail_new.SERVICE_CHAN <- tail_new
	COMMAND_CHAN <- Command{Command: "send_change_config(Confirm_new_tail)", Server: tail_new.Id}
	return
}

func serverDown(server ServerConf) {
	var server_prev ServerConf
	var server_next ServerConf
	_, index := FindServer(server.Id)

	if server.Head_flag {
		server_next = SERVERS[index+1]

		server_next.Head_flag = true
		SERVERS[index+1] = server_next

		server_next.SERVICE_CHAN <- server_next
		COMMAND_CHAN <- Command{Command: "send_change_config(New_head)", Server: server_next.Id}
	} else if server.Tail_flag {
		server_prev = SERVERS[index-1]

		server_prev.Tail_flag = true
		server_prev.PUT_CHANS.Output = nil
		server_prev.COMMIT_CHANS.Input = nil
		server_prev.GET_CHANS.Input = server.GET_CHANS.Input
		SERVERS[index-1] = server_prev

		server_prev.SERVICE_CHAN <- server_prev
		COMMAND_CHAN <- Command{Command: "send_change_config(New_tail)", Server: server_prev.Id}
	} else {
		server_prev = SERVERS[index-1]
		server_next = SERVERS[index+1]

		server_prev.PUT_CHANS.Output = server.PUT_CHANS.Output
		server_next.COMMIT_CHANS.Output = server.COMMIT_CHANS.Output
		SERVERS[index-1] = server_prev
		SERVERS[index+1] = server_next

		server_prev.SERVICE_CHAN <- server_prev
		COMMAND_CHAN <- Command{Command: "send_change_config(New_next)", Server: server_prev.Id}
		server_next.SERVICE_CHAN <- server_next
		COMMAND_CHAN <- Command{Command: "send_change_config(New_prev)", Server: server_next.Id}
	}

	server.SHUTDOWN_CHAN <- 1
	return
}

func Ping(server ServerConf) {
	/*
	for {
		if _, ok := <-server.CLOCK_CONTROL_CHAN; ok {
			cmd := Command{Command: "ping", Server: server.Id}
			COMMAND_CHAN <- cmd
			server.PING_CHANS.Input <- 0
		}

		timeout := PING_WAIT
		recived := false

		for !recived && timeout > 0 {
			select {
			case <-server.PING_CHANS.Output:
				recived = true
			default:
				select {
				case <-server.PING_CHANS.Output:
					recived = true
				case _, ok := <-server.CLOCK_CONTROL_CHAN:
					if ok {
						timeout--
					}
				} 
			}
		}

		if !recived {
			serverDown(server)
			return	
		}

		for i := 0; i < timeout - 1; i++ {
			select {
				case <-server.CLOCK_CONTROL_CHAN:
			}
		}
	}
	*/

	for {
		if _, ok := <-server.CLOCK_CONTROL_CHAN; ok {
			cmd := Command{Command: "ping", Server: server.Id}
			COMMAND_CHAN <- cmd
			server.PING_CHANS.Input <- 0
		}

		timeout := PING_WAIT
		recived := false

		for !recived {
			select {
			case <-server.PING_CHANS.Output:
				recived = true
			default:
				select {
				case <-server.PING_CHANS.Output:
					recived = true
				case _, ok := <-server.CLOCK_CONTROL_CHAN:
					if ok {
						timeout--
						if timeout == 0 {
							go func() {
								for {
									select {
									case <-server.CLOCK_CONTROL_CHAN:
									}
								}
							}()
							serverDown(server)
							return
						}
					}
				} 
			}
		}

		for i := 0; i < timeout - 1; i++ {
			<-server.CLOCK_CONTROL_CHAN
		}
	}
}

func ControlInit() {
	NEXT_ID = NUM_SERVERS
	TIME = 0
	TMP_CLOCK_CHAN = make(chan int, 1)
	TMP_CLOCK_ON = false

	for i := 0; i < NUM_SERVERS; i++ { 
		go Ping(SERVERS[i]) 
	}

	for {
		select {
		case <-RESET_CONTROL:
			return
		default:
			continue
		}
	}
}