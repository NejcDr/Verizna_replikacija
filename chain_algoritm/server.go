package main

import(
	"fmt"
	"time"
)

func put(s *ServerConf, value Value) {
	if _, ok := <-s.CLOCK_SERVER_CHAN; ok {
		value, cmd := s.Put(value)
		if s.Tail_flag {
			time.Sleep(10 * time.Millisecond)
			s.COMMIT_CHANS.Output <- value

			if s.Tail_sync_flag {
				time.Sleep(10 * time.Millisecond)
				s.PUT_CHANS.Output <- value
				str := fmt.Sprintf("Key: %s | Value: %s | Version: %d | Commited: %t | User: %s", value.Key, value.Value, value.Version, value.Commited, value.User) 
				COMMAND_CHAN <- Command{Command: "sync_send", Server: s.Id, Arguments: []string{str}}
			}
		} else {
			time.Sleep(10 * time.Millisecond)
			s.PUT_CHANS.Output <- value
		}
		COMMAND_CHAN <- cmd
		checkAndSendSync(s)
	}
}

func commit(s *ServerConf, value Value) {
	if _, ok := <-s.CLOCK_SERVER_CHAN; ok {
		if value.Key == "confirm_sync" {
			s.Sync_recived_flag = true
			COMMAND_CHAN <- Command{Command: "recived_confirm_sync", Server: s.Id}
			return
		}

		value, cmd := s.Commit(value)
		if !s.Head_flag && cmd.Command != "no_commit" {
			time.Sleep(10 * time.Millisecond)
			s.COMMIT_CHANS.Output <- value
		}
		COMMAND_CHAN <- cmd
	}
}

func get(s *ServerConf, command Command) {
	if _, ok := <-s.CLOCK_SERVER_CHAN; ok {
		done := make(chan int)
		defer close(done)
	
		cmd := Command{Command: "get_input", Server: s.Id}
		COMMAND_CHAN <- cmd
	
		if _, ok := <-s.CLOCK_SERVER_CHAN; ok {
			go func() {
				var returned Command

				if command.Command == "ask" {
					returned = s.Tail_Answer(command, command.Server)
					command.RETURN_CHAN <- returned
				} else {
					command.RETURN_CHAN = s.TAIL_CHANS.Output
					returned = s.Get(command)
				}

				if _, ok := <-s.CLOCK_SERVER_CHAN; ok {
					COMMAND_CHAN <- returned
				}
				done <- 1
			}()
		
			finished := false
			for !finished {
				select {
				case <-done:
					finished = true
				case _, ok := <-s.PING_CHANS.Input:
					if ok {
						if _, ok := <-s.CLOCK_SERVER_CHAN; ok {
							ping(s)
						}
					}
				case _, ok := <-s.CLOCK_SERVER_CHAN:
					if ok { 
						continue 
					}
				}
			}
		}
	
		checkAndSendSync(s)
	}
}

func ping(s *ServerConf) {
	if _, ok := <-s.CLOCK_SERVER_CHAN; ok {
		s.PING_CHANS.Output <- 1
		COMMAND_CHAN <- Command{Command: "pong", Server: s.Id}
		checkAndSendSync(s)
	}
}

func shutdown1(s *ServerConf) {
	if _, ok := <-s.CLOCK_SERVER_CHAN; ok {
		if _, ok := <-s.CLOCK_SERVER_CHAN; ok {
			if !s.Head_flag && !s.Tail_flag {
				chanChange(s.PUT_CHANS.Input, s.PUT_CHANS.Output)
				chanChange(s.COMMIT_CHANS.Input, s.COMMIT_CHANS.Output)
			}
			NUM_SERVERS--
			_, index := FindServer(s.Id)
			SERVERS = append(SERVERS[:index], SERVERS[index+1:]...)
			COMMAND_CHAN <- Command{Command: "confirm_shutdown", Server: s.Id}
		}
	}
}

func changeConfig(s *ServerConf, newServerConf ServerConf) {
	if _, ok := <-s.CLOCK_SERVER_CHAN; ok {
		sOld := *s
		*s = newServerConf
		if _, ok := <-s.CLOCK_SERVER_CHAN; ok {
			COMMAND_CHAN <- Command{Command: "change_server_config", Server: s.Id}
			if s.Tail_sync_flag {
				s.Sync_Storage = s.Get_Storage()
				s.Sync_recived_flag = true
			} else if sOld.Tail_flag == false && s.Tail_flag == true {
				if _, ok := <-s.CLOCK_SERVER_CHAN; ok {
					s.Tail_New_Shutdown()
				}
			}
		}
	}
}

func checkAndSendSync(s *ServerConf) {
	if s.Tail_sync_flag && s.Sync_recived_flag {
		s.Sync_recived_flag = false
		if len(s.Sync_Storage) >= 0 && !s.Sync_done_flag {
			sync_send(s)
		}
	}
}

func sync_recive(s *ServerConf) {
	for {
		select {
		case <-s.PING_CHANS.Input:
			if _, ok := <-s.CLOCK_SERVER_CHAN; ok { ping(s) }
		default:
			select {
			case <-s.PING_CHANS.Input:
				if _, ok := <-s.CLOCK_SERVER_CHAN; ok { ping(s) }
			case value, _ := <-s.PUT_CHANS.Input:
				if _, ok := <-s.CLOCK_SERVER_CHAN; ok {
					if value.Key != "" {
						cmd := s.Tail_New_Add(value)
						COMMAND_CHAN <- cmd
					} else {
						COMMAND_CHAN <- Command{Command: "sync_recived", Server: s.Id, Arguments: []string{"sync_done"}}
						if _, ok := <-s.CLOCK_SERVER_CHAN; ok {
							s.TAIL_CONFIRM_CHAN <- 1
							COMMAND_CHAN <- Command{Command: "sync_done", Server: s.Id}
							return
						}
					}

					done := false
					for !done {
						select {
						case value, _ := <-s.PUT_CHANS.Input:
							if value.Key != "" {
								cmd := s.Tail_New_Add(value)
								COMMAND_CHAN <- cmd
							} else {
								COMMAND_CHAN <- Command{Command: "sync_recived", Server: s.Id, Arguments: []string{"sync_done"}}
								if _, ok := <-s.CLOCK_SERVER_CHAN; ok {
									s.TAIL_CONFIRM_CHAN <- 1
									COMMAND_CHAN <- Command{Command: "sync_done", Server: s.Id}
									return
								}
							}
						default:
							done = true
						}
					}

					if _, ok := <-s.CLOCK_SERVER_CHAN; ok {
						time.Sleep(10 * time.Millisecond)
						s.COMMIT_CHANS.Output <- Value{Key: "confirm_sync"}
						COMMAND_CHAN <- Command{Command: "confirm_sync", Server: s.Id}
					}
				}
			case _, ok := <-s.CLOCK_SERVER_CHAN:
				if ok { continue }
			}
		}
	}
}

func sync_send(s *ServerConf) {
	min := min(BURST_SIZE, len(s.Sync_Storage))

	time.Sleep(10 * time.Millisecond)
	for i := 0; i < min; i++ {
		s.PUT_CHANS.Output <- s.Sync_Storage[i]
		str := fmt.Sprintf("Key: %s | Value: %s | Version: %d | Commited: true | User: %s", s.Sync_Storage[i].Key, s.Sync_Storage[i].Value, s.Sync_Storage[i].Version, s.Sync_Storage[i].User) 
		COMMAND_CHAN <- Command{Command: "sync_send", Server: s.Id, Arguments: []string{str}}
	}

	if len(s.Sync_Storage) <= BURST_SIZE {
		s.PUT_CHANS.Output <- Value{}
		COMMAND_CHAN <- Command{Command: "sync_send", Server: s.Id, Arguments: []string{"sync_done"}}

		s.TAIL_CONFIRM_CHAN <- 1
		COMMAND_CHAN <- Command{Command: "sync_done", Server: s.Id}
		s.Sync_Storage = []Value{}
		s.Sync_done_flag = true
		return
	}

	s.Sync_Storage = s.Sync_Storage[BURST_SIZE:]
}

func Server(serverConf ServerConf) {
	s := &serverConf

	if s.Tail_sync_flag {
		sync_recive(s)
		s.Tail_sync_flag = false
	} else {
		s.Init(INIT_SETUP)
	}
	
	for {
		select {
		case newServerConf, _ := <-s.SERVICE_CHAN:
			changeConfig(s , newServerConf)
		default:
			select {
			case newServerConf, _ := <-s.SERVICE_CHAN:
				changeConfig(s , newServerConf)
			case <-s.SHUTDOWN_CHAN:
				if _, ok := <-s.CLOCK_SERVER_CHAN; ok {
					COMMAND_CHAN <- Command{Command: "shutdown", Server: s.Id}
					for {
						select {
						case <-s.SHUTDOWN_CHAN:
							shutdown1(s)
							return
						default:
							select {
							case <-s.SHUTDOWN_CHAN:
								shutdown1(s)
								return
							case _, ok := <-s.PING_CHANS.Input:
								if ok { continue }
							case _, ok := <-s.CLOCK_SERVER_CHAN:
								if ok { continue }
							}
						}
					}
				}
			case <-s.PING_CHANS.Input:
				ping(s)
			case value, _ := <-s.PUT_CHANS.Input:
				put(s, value)
			case value, _ := <-s.COMMIT_CHANS.Input:
				commit(s, value)
			case command, _ := <-s.GET_CHANS.Input:
				get(s, command)
			case _, ok := <-s.CLOCK_SERVER_CHAN:
				if ok { 
					checkAndSendSync(s)
				}
			}
		}
	}
}

func ServersInit() {
	for i := 0; i < NUM_SERVERS; i++ {
		go func(i int) { 
			Server(SERVERS[i]) 
		}(i)
	}

	for {
		select {
		case <-RESET_SERVERS:
			return
		default:
			continue
		}
	}
}