package main

import(
	"fmt"
	"strings"
)

func (s *ServerConf) Init(init []Value) {
	var insert Value

	for _, v := range init {
		insert.Key = v.Key
		insert.Value = v.Value
		insert.Version = v.Version
		insert.User = v.User
		insert.Commited = true

		s.Storage[insert.Key] = insert
	}
}

func (s *ServerConf) Get(command Command) Command {
	var args []string

	if len(command.Arguments) == 0 {
		for k, v := range s.Storage {
			if !v.Commited {
				returned := Ask(s.Id, k, s.TAIL_CHANS.Input, s.TAIL_CHANS.Output)
				if len(returned.Arguments) != 0 {
					args = append(args, returned.Arguments[0])
				}
			} else {
				str := fmt.Sprintf("Key: %s | Value: %s | Version: %d | User: %s", k, v.Value, v.Version, v.User)
				args = append(args, str)
			}
		}
	} else {
		k := command.Arguments[0]
		if v, ok := s.Storage[k]; ok {
			if !v.Commited {
				returned := Ask(s.Id, k, s.TAIL_CHANS.Input, s.TAIL_CHANS.Output)
				if len(returned.Arguments) != 0 {
					args = append(args, returned.Arguments[0])
				}
			} else {
				str := fmt.Sprintf("Key: %s | Value: %s | Version: %d | User: %s", k, v.Value, v.Version, v.User)
				args = append(args, str)
			}
		}
	}

	return Command{Command: "get_return", Server: s.Id, Arguments: args}
}

func Ask(id int, k string, tail_get chan Command, tail_return chan Command) Command {
	strCommand := fmt.Sprintf("Key: %s", k)
	cmd := Command{Command: "ask", Server: id, Arguments: []string{strCommand}, RETURN_CHAN: tail_return}
	tail_get <- cmd
	COMMAND_CHAN <- cmd
	returned, _ := <-tail_return
	return returned
}

func (s *ServerConf) Put(value Value) (Value, Command) {
	var version int
	var command string
	if v, ok := s.Storage[value.Key]; ok {
		version = v.Version
	} else {
		version = 0
	}

	value.Commited = s.Tail_flag
	value.Version = version + 1
	s.Storage[value.Key] = value

	if s.Tail_flag {
		command = "tail"
	} else {
		command = "put"
	}

	strCommand := fmt.Sprintf("Key: %s | Value: %s | Version: %d | Commited: %t | User: %s", value.Key, value.Value, value.Version, value.Commited, value.User)
	return Value{Key: value.Key, Value: value.Value, Version: value.Version, Commited: value.Commited, User: value.User}, Command{Command: command, Server: s.Id, Arguments: []string{strCommand}}
}

func (s *ServerConf) Commit(value Value) (Value, Command) {
	var command string
	v, _ := s.Storage[value.Key]

	if (v.Version <= value.Version) {
		value.Commited = true
		s.Storage[value.Key] = value
		command = "commit"
	} else {
		command = "no_commit"
	}

	strCommand := fmt.Sprintf("Key: %s | Value: %s | Version: %d | Commited: %t | User: %s", value.Key, value.Value, value.Version, value.Commited, value.User)
	return Value{Key: value.Key, Value: value.Value, Version: value.Version, Commited: value.Commited, User: value.User}, Command{Command: command, Server: s.Id, Arguments: []string{strCommand}}
}

func (s *ServerConf) Tail_Answer(command Command, returnId int) Command {
	var args []string

	fields := strings.Fields(command.Arguments[0])
	k := fields[1]
	if v, ok := s.Storage[k]; ok {
		str := fmt.Sprintf("Key: %s | Value: %s | Version: %d | Commited: %t | User: %s", k, v.Value, v.Version, v.Commited, v.User)
		args = append(args, str)
	}

	return Command{Command: "answered", Server: returnId, Arguments: args}
}

func (s *ServerConf) Tail_New_Shutdown() {
	var strCommand string

	for k, v := range s.Storage {
		value := v

		if !value.Commited {
			value.Commited = true
			s.Storage[k] = value

			s.COMMIT_CHANS.Output <- value

			strCommand = fmt.Sprintf("Key: %s | Value: %s | Version: %d | Commited: %t | User: %s", value.Key, value.Value, value.Version, value.Commited, value.User)
			COMMAND_CHAN <- Command{Command: "tail_confirm", Server: s.Id, Arguments: []string{strCommand}}
		}
	}
}

func (s *ServerConf) Tail_New_Add(value Value) Command {
	if v, ok := s.Storage[value.Key]; ok && v.Version <= value.Version {
		if v.Version <= value.Version {
			s.Storage[value.Key] = value
			strCommand := fmt.Sprintf("Key: %s | Value: %s | Version: %d | Commited: %t | User: %s", value.Key, value.Value, value.Version, value.Commited, value.User) 
			return Command{Command: "sync_recived", Server: s.Id, Arguments: []string{strCommand}}
		}
	} else {
		s.Storage[value.Key] = value
		strCommand := fmt.Sprintf("Key: %s | Value: %s | Version: %d | Commited: %t | User: %s", value.Key, value.Value, value.Version, value.Commited, value.User) 
		return Command{Command: "sync_recived", Server: s.Id, Arguments: []string{strCommand}}
	}

	return Command{}
}

func (s *ServerConf) Get_Storage() []Value {
	var slice []Value

	for k, v := range s.Storage {
		value := Value{Key: k, Value: v.Value, Version: v.Version, Commited: v.Commited, User: v.User}
		slice = append(slice, value)
	}

	return slice
}