package main

type Value struct {
	Key string `json:"key"`
	Value string `json:"value"`
	Version int `json:"version"`
	Commited bool `json:"commited"`
	User string `json:"user"`
}

type Command struct {
	Command string `json:"command"`
	Server int `json:"server"`
	Arguments []string `json:"arguments"`
	RETURN_CHAN chan Command `json:"-"`
}

type ServerConf struct {
	Id int
	Storage map[string]Value
	Head_flag bool
	Tail_flag bool
	Tail_sync_flag bool
	PUT_CHANS Dual_Value
	COMMIT_CHANS Dual_Value
	GET_CHANS Dual_Command
	CLOCK_SERVER_CHAN chan int
	CLOCK_CONTROL_CHAN chan int
	TAIL_CHANS Dual_Command
	PING_CHANS Dual_Int
	SHUTDOWN_CHAN chan int
	SERVICE_CHAN chan ServerConf
	TAIL_CONFIRM_CHAN chan int
	Sync_recived_flag bool
	Sync_done_flag bool
	Sync_Storage []Value
}

type Dual_Value struct {
	Input chan Value
	Output chan Value
}

type Dual_Command struct {
	Input chan Command
	Output chan Command
}

type Dual_Int struct {
	Input chan int
	Output chan int
}

type Events struct {
	Time int `json:"time"`
	Events []Command `json:"events"`
}

type Read struct {
	Key string `json:"key"`
	Server int `json:"server"`
}

type Configuration struct {
	NServers int `json:"nservers"`
	Init []Value `json:"init"`
}