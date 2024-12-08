import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './styles.css';

const Visualization = () => {
  const Ref = useRef(null);
  const Svg = d3.select(Ref.current);
  const TerminalRef = useRef(null);
  const OutputRef = useRef(null);
  const NumServers = useRef(0);
  const Init = useRef([]);
  const MaxMsg = 10;
  const [Loaded, setLoaded] = useState(false);
  var AutoClockIntervalId = null;
  var SimError = false;
  var CurrentMsgId = 0;

  const Servers = useRef([
    { id: 0, x: 225, y1: 250, y2: 405, y3: 445, y4: 530, readValue: useRef(), status: useRef("sleep"), storage: [], putIN: -1, putOUT: 0, commitIN: 0, commitOUT: -1 },
    { id: 1, x: 375, y1: 250, y2: 405, y3: 445, y4: 530, readValue: useRef(), status: useRef("sleep"), storage: [], putIN: 0, putOUT: 1, commitIN: 1, commitOUT: 0 },
    { id: 2, x: 525, y1: 250, y2: 405, y3: 445, y4: 530, readValue: useRef(), status: useRef("sleep"), storage: [], putIN: 1, putOUT: 2, commitIN: 2, commitOUT: 1 },
    { id: 3, x: 675, y1: 250, y2: 405, y3: 445, y4: 530, readValue: useRef(), status: useRef("sleep"), storage: [], putIN: 2, putOUT: 3, commitIN: 3, commitOUT: 2 },
    { id: 4, x: 825, y1: 250, y2: 405, y3: 445, y4: 530, readValue: useRef(), status: useRef("sleep"), storage: [], putIN: 3, putOUT: 4, commitIN: 4, commitOUT: 3 },
    { id: 5, x: 975, y1: 250, y2: 405, y3: 445, y4: 530, readValue: useRef(), status: useRef("sleep"), storage: [], putIN: 4, putOUT: 5, commitIN: 5, commitOUT: 4 },
    { id: 6, x: 1125, y1: 250, y2: 405, y3: 445, y4: 530, readValue: useRef(), status: useRef("sleep"), storage: [], putIN: 5, putOUT: -1, commitIN: -1, commitOUT: 5 }
  ]);
  const PutPath = [
    { id: 0, x1: 255, x2: 345, y: 240, messages: [] },
    { id: 1, x1: 405, x2: 495, y: 240, messages: [] },
    { id: 2, x1: 555, x2: 645, y: 240, messages: [] },
    { id: 3, x1: 705, x2: 795, y: 240, messages: [] },
    { id: 4, x1: 855, x2: 945, y: 240, messages: [] },
    { id: 5, x1: 1005, x2: 1095, y: 240, messages: [] }
  ];
  const CommitPath = [
    { id: 0, x1: 345, x2: 255, y: 260, messages: [] },
    { id: 1, x1: 495, x2: 405, y: 260, messages: [] },
    { id: 2, x1: 645, x2: 555, y: 260, messages: [] },
    { id: 3, x1: 795, x2: 705, y: 260, messages: [] },
    { id: 4, x1: 945, x2: 855, y: 260, messages: [] },
    { id: 5, x1: 1095, x2: 1005, y: 260, messages: [] }
  ];
  const GetInputPath = [
    { id: 0, x: 215, y1: 380, y2: 280, messages: []},
    { id: 1, x: 365, y1: 380, y2: 280, messages: []},
    { id: 2, x: 515, y1: 380, y2: 280, messages: []},
    { id: 3, x: 665, y1: 380, y2: 280, messages: []},
    { id: 4, x: 815, y1: 380, y2: 280, messages: []},
    { id: 5, x: 965, y1: 380, y2: 280, messages: []},
    { id: 6, x: 1115, y1: 380, y2: 280, messages: []}
  ];
  const GetOutputPath = [
    { id: 0, x: 235, y1: 280, y2: 380, messages: []},
    { id: 1, x: 385, y1: 280, y2: 380, messages: []},
    { id: 2, x: 535, y1: 280, y2: 380, messages: []},
    { id: 3, x: 685, y1: 280, y2: 380, messages: []},
    { id: 4, x: 835, y1: 280, y2: 380, messages: []},
    { id: 5, x: 985, y1: 280, y2: 380, messages: []},
    { id: 6, x: 1135, y1: 280, y2: 380, messages: []}
  ];
  const PingPath = [
    { id: 0, x: 215, y1: 220, y2: 70, messages: []},
    { id: 1, x: 365, y1: 220, y2: 70, messages: []},
    { id: 2, x: 515, y1: 220, y2: 70, messages: []},
    { id: 3, x: 665, y1: 220, y2: 70, messages: []},
    { id: 4, x: 815, y1: 220, y2: 70, messages: []},
    { id: 5, x: 965, y1: 220, y2: 70, messages: []},
    { id: 6, x: 1115, y1: 220, y2: 70, messages: []}
  ];
  const ControlPath = [
    { id: 0, x: 235, y1: 220, y2: 70, messages: []},
    { id: 1, x: 385, y1: 220, y2: 70, messages: []},
    { id: 2, x: 535, y1: 220, y2: 70, messages: []},
    { id: 3, x: 685, y1: 220, y2: 70, messages: []},
    { id: 4, x: 835, y1: 220, y2: 70, messages: []},
    { id: 5, x: 985, y1: 220, y2: 70, messages: []},
    { id: 6, x: 1135, y1: 220, y2: 70, messages: []}
  ];

  const UserRed = { x: 75, y1: 150, y2: 210, y3: 250, y4: 230, y5: 115, key: useRef(), value: useRef(), waitingMsg: useRef(false), waitingTime: useRef(null), line_in: { x1: 115, y1: 140, x2: 195, y2: 220, messages: [] }, line_out: { x1: 195, y1: 240, x2: 115, y2: 160, messages: [] } };
  const UserBlue = { x: 75, y1: 350, y2: 410, y3: 450, y4: 430, y5: 315, key: useRef(), value: useRef(), waitingMsg: useRef(false), waitingTime: useRef(null), line_in: { x1: 115, y1: 340, x2: 195, y2: 260, messages: [] }, line_out: { x1: 195, y1: 280, x2: 115, y2: 360, messages: [] } };
//-------------------------------------------------------------------------------------------------------------
  useEffect(() => {
    Svg.attr('width', 1200).attr('height', 600);
    
    Svg.append('line').attr('x1', 0).attr('y1', 0).attr('x2', 1200).attr('y2', 0).attr('stroke', 'black').attr('stroke-width', 1).attr('opacity', 0.5);
    Svg.append('line').attr('x1', 0).attr('y1', 600).attr('x2', 1200).attr('y2', 600).attr('stroke', 'black').attr('stroke-width', 1).attr('opacity', 0.5);
    Svg.append('line').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 600).attr('stroke', 'black').attr('stroke-width', 1).attr('opacity', 0.5);
    Svg.append('line').attr('x1', 1200).attr('y1', 0).attr('x2', 1200).attr('y2', 600).attr('stroke', 'black').attr('stroke-width', 1).attr('opacity', 0.5);

    if (!Loaded) return;
  
    Svg.append('defs').append('marker').attr('id', 'arrowhead-start').attr('viewBox', '0 -5 10 10').attr('refX', 0).attr('refY', 0).attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto').append('path').attr('d', 'M10,-5L0,0L10,5').attr('fill', 'black');
    Svg.append('defs').append('marker').attr('id', 'arrowhead-end').attr('viewBox', '0 -5 10 10').attr('refX', 10).attr('refY', 0).attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto-start-reverse').append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', 'black');

    Svg.append('image').attr('id', `image-control`).attr('xlink:href', 'control_plane.svg')
      .attr('x', 675 - 500).attr('y', 35 - 25).attr('width', 1000).attr('height', 50);

    var nServers = 0;
    Servers.current.forEach(server => {
      if (server.status.current === "sleep") { return; }
      drawServer(server, 'server_on.svg');
      if (Init.current && Array.isArray(Init.current)) { Init.current.forEach(value => { saveValue(server, value, "green"); }); }
      nServers++;
    });

    drawUser(UserRed, UserRed.key, UserRed.value, "red", "user_red.svg", handleRedSendButton);
    drawUser(UserBlue, UserBlue.key, UserBlue.value, "blue", "user_blue.svg", handleBlueSendButton);

    for (let i = 0; i < nServers - 1; i++) {
      drawArrow(`put_line-${PutPath[i].id}`, PutPath[i].x1, PutPath[i].y, PutPath[i].x2, PutPath[i].y, "single");
      drawArrow(`commit_line-${CommitPath[i].id}`, CommitPath[i].x1, CommitPath[i].y, CommitPath[i].x2, CommitPath[i].y, "single");
    }

    drawArrow(`put_line-red`, UserRed.line_in.x1, UserRed.line_in.y1, UserRed.line_in.x2, UserRed.line_in.y2, "single");
    drawArrow(`commit_line-red`, UserRed.line_out.x1, UserRed.line_out.y1, UserRed.line_out.x2, UserRed.line_out.y2, "single");
    drawArrow(`put_line-blue`, UserBlue.line_in.x1, UserBlue.line_in.y1, UserBlue.line_in.x2,  UserBlue.line_in.y2, "single");
    drawArrow(`commit_line-blue`, UserBlue.line_out.x1, UserBlue.line_out.y1, UserBlue.line_out.x2, UserBlue.line_out.y2, "single");
  }, [Loaded]);

  useEffect(() => {
    if (!Loaded) return;
    const eventsSource = new EventSource('http://localhost:8080/events');
    eventsSource.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      console.log(data);
      updateTerminal(data);

      var put_cmd_array = [], commit_cmd_array = [], tail_cmd_array = [], ping_cmd_array = [], get_cmd_array = [], tail_ask_array = [], config_cmd_array = [], sync_cmd_array = [], shutdown_cmd_array = [];

      data.events.forEach(cmd => {
        if (cmd.command === "put") { put_cmd_array.push(cmd); } 
        else if (cmd.command === "commit" || cmd.command === "no_commit") { commit_cmd_array.push(cmd); } 
        else if (cmd.command === "tail" || cmd.command === "tail_confirm") { tail_cmd_array.push(cmd); } 
        else if (cmd.command === "ping" || cmd.command === "pong") { ping_cmd_array.push(cmd); } 
        else if (cmd.command === "get_input" || cmd.command === "get_return") { get_cmd_array.push(cmd); } 
        else if (cmd.command === "ask" || cmd.command === "answered") { tail_ask_array.push(cmd); }
        else if (cmd.command === "send_change_config(Sync_new_tail)" || cmd.command === "send_change_config(Confirm_new_tail)" || cmd.command === "sync_done" || cmd.command === "change_server_config" || cmd.command === "send_change_config(New_head)" || cmd.command === "send_change_config(New_tail)" || cmd.command === "send_change_config(New_next)" || cmd.command === "send_change_config(New_prev)") { config_cmd_array.push(cmd); }
        else if (cmd.command === "sync_recived" || cmd.command === "sync_send" || cmd.command === "confirm_sync" || cmd.command === "recived_confirm_sync") { sync_cmd_array.push(cmd); }
        else if (cmd.command === "shutdown" || cmd.command === "confirm_shutdown") { shutdown_cmd_array.push(cmd); }
      });

      put_cmd_array.sort((a, b) => b.server - a.server);
      commit_cmd_array.sort((a, b) => a.server - b.server);
      tail_ask_array.sort((a, b) => a.server - b.server);

      const commitPromise = commit_cmd_array.map(cmd => {
        if (cmd.command === "commit") { return commit(cmd); } 
        else if (cmd.command === "no_commit") { return no_commit(cmd); }
        return Promise.resolve();
      });
      const tailPromise = tail_cmd_array.map(cmd => {
        if (cmd.command === "tail") { return tail(cmd); }
        else if (cmd.command === "tail_confirm") {return tailConfirm(cmd); }
        return Promise.resolve();
      });
      const putPromise = put_cmd_array.map(cmd => put(cmd));
      const pingPromise = ping_cmd_array.map(cmd => {
        if (cmd.command === "ping") { return ping(cmd); } 
        else if (cmd.command === "pong") { return pong(cmd); }
        return Promise.resolve();
      });
      const getPromise = get_cmd_array.map(cmd => {
        if (cmd.command === "get_input") { return get_input(cmd); } 
        else if (cmd.command === "get_return") { return get_return(cmd); }
        return Promise.resolve();
      });
      const askPromise = tail_ask_array.map(cmd => {
        if (cmd.command === "ask") { return ask(cmd); } 
        else if (cmd.command === "answered") { return answered(cmd); }
        return Promise.resolve();
      });
      const configPromise = config_cmd_array.map(cmd => {
        if (cmd.command === "send_change_config(Sync_new_tail)" || cmd.command === "send_change_config(Confirm_new_tail)" || cmd.command === "send_change_config(New_head)" || cmd.command === "send_change_config(New_tail)" || cmd.command === "send_change_config(New_next)" || cmd.command === "send_change_config(New_prev)") { return sendConfig(cmd); }
        else if (cmd.command === "sync_done") { return syncDone(cmd); }
        else if (cmd.command === "change_server_config") { return reciveConfig(cmd); }
        return Promise.resolve();
      });
      const syncPromise = sync_cmd_array.map(cmd => {
        if (cmd.command === "sync_recived") { return syncRecive(cmd); }
        else if (cmd.command === "sync_send") { return syncSend(cmd); }
        else if (cmd.command === "confirm_sync") { return confirmSync(cmd); }
        else if (cmd.command === "recived_confirm_sync") { return reciveConfirmSync(cmd); }
        return Promise.resolve();
      });
      const shutdownPromise = shutdown_cmd_array.map(cmd => {
        if (cmd.command === "shutdown") { return shutdown(cmd); }
        else if (cmd.command === "confirm_shutdown") { return confirmShutdown(cmd); }
        return Promise.resolve();
      });

      await Promise.all([Promise.all(shutdownPromise), Promise.all(configPromise), Promise.all(syncPromise), Promise.all(commitPromise), Promise.all(tailPromise), Promise.all(putPromise), Promise.all(pingPromise), Promise.all(getPromise), Promise.all(askPromise)]);

      if (SimError) {
        alert("Simulation encountered an error and will restart!");
        resetSimulation();
        fetchServers();
        SimError = false;
      }
    };
    eventsSource.onopen = () => { console.log('Connection to event source established.'); };
    eventsSource.onerror = function(event) { console.error('EventSource error:', event); };
    return () => { eventsSource.close(); };
  }, [Loaded]);
//-------------------------------------------------------------------------------------------------------------
  const drawServer = (server, image) => {
    Svg.append('image').attr('id', `image-${server.id}`).attr('xlink:href', `${image}`).attr('x', server.x - 25).attr('y', server.y1 - 25).attr('width', 50).attr('height', 50);
  
    Svg.append('foreignObject').attr('id', `key_input-${server.id}`).attr('x', server.x - 50).attr('y', server.y2 - 15).attr('width', 60).attr('height', 30)
      .append('xhtml:body').append('div').html(`<input type="text" id="key-input-${server.id}" placeholder="key" class="read-input" maxlength="1"/>`)
      .select('input').each(function () { server.readValue.current = this; });

    Svg.append('foreignObject').attr('id', `read_button-${server.id}`).attr('x', server.x + 20).attr('y', server.y2 - 20).attr('width', 30).attr('height', 40)
      .append('xhtml:body').append('div').html( `
        <button id="read-button-${server.id}" class="button-read">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
            <path d="M498.1 5.6c10.1 7 15.4 19.1 13.5 31.2l-64 416c-1.5 9.7-7.4 18.2-16 23s-18.9 5.4-28 1.6L284 427.7l-68.5 74.1c-8.9 9.7-22.9 12.9-35.2 8.1S160 493.2 160 480V396.4c0-4 1.5-7.8 4.2-10.7L331.8 202.8c5.8-6.3 5.6-16-.4-22s-15.7-6.4-22-.7L106 360.8 17.7 316.6C7.1 311.3 .3 300.7 0 288.9s5.9-22.8 16.1-28.7l448-256c10.7-6.1 23.9-5.5 34 1.4z" fill="#fff"/>
          </svg>
        </button>`)
      .select('button').on('click', () => handleReadButton(server.id));
    
    Svg.append('foreignObject').attr('id', `shutdown_button-${server.id}`).attr('x', server.x - 15).attr('y', server.y3 - 20).attr('width', 30).attr('height', 40)
      .append('xhtml:body').append('div').html( `
        <button id="shutdown-button-${server.id}" class="button-shutdown">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
            <path d="M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 208c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-176c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 272c0 1.5 0 3.1 .1 4.6L67.6 283c-16-15.2-41.3-14.6-56.6 1.4s-14.6 41.3 1.4 56.6L124.8 448c43.1 41.1 100.4 64 160 64l19.2 0c97.2 0 176-78.8 176-176l0-208c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 112c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-176c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 176c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-208z" fill="#fff"/>
          </svg>
        </button>`)
      .select('button').on('click', () => handleDeleteButton(server.id));

    Svg.append('foreignObject').attr('id', `storage-${server.id}`).attr('x', server.x - 70).attr('y', server.y4 - 60).attr('width', 140) .attr('height', 120)
      .append('xhtml:body').append('div').html(`<div id="storage-terminal-${server.id}" class="storage-terminal"><div id="server-status-${server.id}" class="storage-line">${server.status.current}</div></div>`);
    
    drawArrow(`ping_line-${server.id}`, PingPath[server.id].x, PingPath[server.id].y1, PingPath[server.id].x, PingPath[server.id].y2, "double");
    drawArrow(`control_line-${server.id}`, ControlPath[server.id].x, ControlPath[server.id].y1, ControlPath[server.id].x, ControlPath[server.id].y2, "double");
    drawArrow(`get_input_line-${server.id}`, GetInputPath[server.id].x, GetInputPath[server.id].y1, GetInputPath[server.id].x, GetInputPath[server.id].y2, "single");
    drawArrow(`get_output_line-${server.id}`, GetOutputPath[server.id].x, GetOutputPath[server.id].y1, GetOutputPath[server.id].x, GetOutputPath[server.id].y2, "single");
  };
  const drawUser = (user, key, value, color, image, buttonFunction) => {
    Svg.append('foreignObject').attr('id', `timeout-${color}`).attr('x', user.x - 30).attr('y',  user.y5 - 15).attr('width', 60) .attr('height', 30)
      .append('xhtml:body').append('div').html(`<div id="timeout-${color}"></div>`);

    Svg.append('image').attr('xlink:href', `${image}`).attr('x', user.x - 35).attr('y', user.y1 - 35).attr('width', 70).attr('height', 70);
  
    Svg.append('foreignObject').attr('x', user.x - 50).attr('y', user.y2 - 15).attr('width', 60).attr('height', 30)
      .append('xhtml:body').append('div').html(`<input type="text" id="${color}-key-input" placeholder="key" class="${color}-input" maxlength="1"/>`)
      .select('input').each(function () { key.current = this; });
  
    Svg.append('foreignObject').attr('x', user.x - 50).attr('y',  user.y3 - 15).attr('width', 60).attr('height', 30)
      .append('xhtml:body').append('div').html(`<input type="text" id="${color}-value-input" placeholder="value" class="${color}-input" maxlength="1"/>`)
      .select('input').each(function () { value.current = this; });
  
    Svg.append('foreignObject').attr('x', user.x + 20).attr('y', user.y4 - 20).attr('width', 30).attr('height', 40)
      .append('xhtml:body').append('div').html(`
        <button id="${color}-send-button" class="button-send-${color}">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
            <path d="M498.1 5.6c10.1 7 15.4 19.1 13.5 31.2l-64 416c-1.5 9.7-7.4 18.2-16 23s-18.9 5.4-28 1.6L284 427.7l-68.5 74.1c-8.9 9.7-22.9 12.9-35.2 8.1S160 493.2 160 480V396.4c0-4 1.5-7.8 4.2-10.7L331.8 202.8c5.8-6.3 5.6-16-.4-22s-15.7-6.4-22-.7L106 360.8 17.7 316.6C7.1 311.3 .3 300.7 0 288.9s5.9-22.8 16.1-28.7l448-256c10.7-6.1 23.9-5.5 34 1.4z" fill="#fff"/>
          </svg>
        </button>`)
      .select('button').on('click', buttonFunction);
  };
  const drawArrow = (id, x1, y1, x2, y2, type) => {
    const line = Svg.append('line').attr('id', `${id}`).attr('x1', x1).attr('y1', y1).attr('x2', x2).attr('y2', y2)
      .attr('stroke', 'black').attr('stroke-width', 2).attr('marker-end', 'url(#arrowhead-end)');
    
    if (type === "double") { line.attr('marker-start', 'url(#arrowhead-start)'); }
  };
  const drawMessage = (id, x, y, color) => {
    Svg.append('circle').attr('id', id).attr('cx', x).attr('cy', y).attr('r', 5).attr('fill', `${color}`).attr('stroke', 'black') .attr('stroke-width', 2);
  };
  const moveMessage = (id, time, x, y) => {
    d3.select(`#${id}`).transition().duration(time).attr('cx', x).attr('cy', y);
  };
//-------------------------------------------------------------------------------------------------------------
  const incrementWaitingTime = (user, color) => {
    user.waitingTime.current++;
    d3.select(`#timeout-${color}`).text(`${user.waitingTime.current}`);
  };
  const resetWaitingTime = (user, color) => {
    user.waitingMsg.current = false;
    user.waitingTime.current = 0;
    d3.select(`#timeout-${color}`).text(``);
    [document.getElementById(`${color}-key-input`), document.getElementById(`${color}-value-input`), document.getElementById(`${color}-send-button`)].forEach(el => el.disabled = false);
  };
//-------------------------------------------------------------------------------------------------------------
  const getOutputPutLine = (serverId) => {
    for (let i = serverId + 1; i < Servers.current.length; i++) {
      const nextServer = Servers.current.find(s => s.id === i);
      if (nextServer.status.current !== "dead") {
        const line = PutPath.find(s => s.id === nextServer.putIN);
        return line;
      }
    }
    return null;
  };
  const getOutputCommitLine = (serverId) => {
    for (let i = serverId - 1; i >= 0; i--) {
      const prevServer = Servers.current.find(s => s.id === i);
      if (prevServer.status.current !== "dead") {
        const line = CommitPath.find(s => s.id === prevServer.commitIN);
        return line;
      }
    }
    return null;
  };
//-------------------------------------------------------------------------------------------------------------
  const getOldTail = (serverId) => {
    for (let i = serverId - 1; i >= 0; i--) {
      const tailServer = Servers.current.find(s => s.id === i);
      if (tailServer.status.current !== "sleep" && tailServer.status.current !== "shutdown" && tailServer.status.current !== "dead") { return i; }
    }
    return -1;
  };
  const getValue = (str) => {
    const parts = str.split('|');
    var value = {};

    parts.forEach(part => {
      const [k, v] = part.split(':').map(str => str.trim());
      const formattedKey = k.toLowerCase(); 
      const formattedValue = isNaN(v) ? v : Number(v);
      value[formattedKey] = formattedValue;
    });
    return value;
  };
  const saveValue = (server, newValue, color) => {
    const terminal = document.getElementById(`storage-terminal-${server.id}`);
    const value = server.storage.find(v => v.key === newValue.key);

    const updateStorageTerminal = (id, value, color, terminal) => {
      var line = document.getElementById(`line-${id}-${value.key}`);
    
      if (!line) {
        line = document.createElement('div');
        line.className = 'storage-line';
        line.id = `line-${id}-${value.key}`;
      } else {
        line.innerHTML = '';
      }

      const commited = document.createElement('span');
      commited.className = 'circle';
      commited.style.backgroundColor = color;

      const text = document.createTextNode(` | ${value.key} | ${value.value} | ${value.version} | `);

      const user = document.createElement('span');
      user.className = 'circle';
      user.style.backgroundColor = value.user;

      line.appendChild(commited);
      line.appendChild(text);
      line.appendChild(user);

      if (!line.parentNode) { terminal.appendChild(line); }
    }

    if (value === undefined) {
      server.storage.push(newValue);
      updateStorageTerminal(server.id, newValue, color, terminal);
    } else if (value.version <= newValue.version) {
      value.value = newValue.value;
      value.version = newValue.version;
      value.commited = newValue.commited;
      value.user = newValue.user;
      updateStorageTerminal(server.id, newValue, color, terminal);
    }
  };
  const findNewServer = () => {
    const index = Servers.current.findIndex(server => server.status.current === "sleep");
    return index;
  };
  const changeServerStatus = (server, newStatus) => {
    server.status.current = newStatus;
    d3.select(`#server-status-${server.id}`).text(newStatus);
  };
//-------------------------------------------------------------------------------------------------------------
  const fetchServers = async () => {
    try {
      const response = await fetch('http://localhost:8080/config');
      const data = await response.json();
      NumServers.current = data.nservers;
      console.log();
      Init.current = data.Init;
      Servers.current.forEach((server, i) => {
        if (i < data.nservers) {
          if (i === 0) { 
            if (NumServers.current === 1) { changeServerStatus(server, "head_tail"); } 
            else { changeServerStatus(server, "head"); } 
          } 
          else if (i === data.nservers - 1) { changeServerStatus(server, "tail"); } 
          else { changeServerStatus(server, "middle"); }
        }
      });
      setLoaded(true);
      SimError = false;
    } catch (error) { console.error('Error fetching servers:', error); }
  };
  const resetSimulation = () => {
    const leftTerminal = OutputRef.current;
    const rightTerminal = TerminalRef.current;
    const checkbox = document.getElementById('clockAuto');

    if (checkbox.checked && AutoClockIntervalId) {
      clearInterval(AutoClockIntervalId);
      AutoClockIntervalId = null;
      checkbox.checked = false;
    }

    fetch('http://localhost:8080/reset', { method: 'POST', })
    .catch(error => { console.error('Error:', error); });

    Servers.current.forEach(server => {
      changeServerStatus(server, "sleep");
      server.storage.length = 0;
      [GetInputPath, GetOutputPath, PingPath, ControlPath].forEach(path => path[server.id].messages.length = 0);
    });

    PutPath.forEach(line => { line.messages.length = 0; });
    CommitPath.forEach(line => { line.messages.length = 0; });

    [UserRed.line_in, UserRed.line_out, UserBlue.line_in, UserBlue.line_out].forEach(path => path.messages.length = 0);

    resetWaitingTime(UserRed, "red");
    resetWaitingTime(UserBlue, "blue");

    Svg.selectAll("*").remove();
    setLoaded(false);
    SimError = false;
    leftTerminal.innerHTML = '';
    rightTerminal.innerHTML = '';
  };
//-------------------------------------------------------------------------------------------------------------
  const handleRedSendButton = () => {
    const key = UserRed.key.current.value;
    const value = UserRed.value.current.value;
    const line = UserRed.line_in;

    if (!key || !value) { 
      alert("Fields key and value must not be empty!"); 
      return;
    } 

    if (line && line.messages.length < MaxMsg) {
      const id = `msg-${CurrentMsgId}`;
      CurrentMsgId++;
      line.messages.push({ id: id });

      fetch('http://localhost:8080/input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Key: key, Value: value, User: "red" })
      })
      .then(response => {
        if (response.ok) { console.log('Input sent successfully'); } 
        else { console.error('Failed to send input'); }
      })
      .catch(error => { console.error('Error:', error); });

      drawMessage(id, line.x1, line.y1, 'red');
      moveMessage(id, 500, line.x2, line.y2);

      [document.getElementById('red-key-input'), document.getElementById('red-value-input'), document.getElementById('red-send-button')].forEach(el => el.disabled = true);

      UserRed.waitingMsg.current = true;
      UserRed.waitingTime.current = 0;
      d3.select(`#timeout-red`).text(`${UserRed.waitingTime.current}`);
    }
  };
  const handleBlueSendButton = () => {
    const key = UserBlue.key.current.value;
    const value = UserBlue.value.current.value;
    const line = UserBlue.line_in;

    if (!key || !value) { 
      alert("Fields key and value must not be empty!") 
      return
    } 

    if (line && line.messages.length < MaxMsg) {
      const id = `msg-${CurrentMsgId}`;
      CurrentMsgId++;
      line.messages.push({ id: id });

      fetch('http://localhost:8080/input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Key: key, Value: value, User: "blue" })
      })
      .then(response => {
        if (response.ok) { console.log('Input sent successfully'); } 
        else { console.error('Failed to send input'); }
      })
      .catch(error => { console.error('Error:', error); });

      drawMessage(id, line.x1, line.y1, 'blue');
      moveMessage(id, 500, line.x2, line.y2);

      [document.getElementById('blue-key-input'), document.getElementById('blue-value-input'), document.getElementById('blue-send-button')].forEach(el => el.disabled = true);

      UserBlue.waitingMsg.current = true;
      UserBlue.waitingTime.current = 0;
      d3.select(`#timeout-blue`).text(`${UserBlue.waitingTime.current}`);
    } 
  };
  const handleReadButton = (serverId) => {
    const server = Servers.current.find(s => s.id === serverId);
    const key = server.readValue.current.value;
    const line = GetInputPath[serverId];

    if (line && line.messages.length < MaxMsg) {
      const id = `msg-${CurrentMsgId}`;
      CurrentMsgId++;
      line.messages.push({ id: id });
      
      fetch('http://localhost:8080/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: key, server: serverId })
      })
      .then(response => {
        if (response.ok) { console.log('Read sent successfully'); } 
        else { console.error('Failed to send read'); }
      })
      .catch(error => { console.error('Error:', error); });

      drawMessage(id, line.x, line.y1, 'orange');
      moveMessage(id, 500, line.x, line.y2 + (line.messages.length - 1) * 10);

      [document.getElementById(`key-input-${serverId}`), document.getElementById(`read-button-${serverId}`)].forEach(el => el.disabled = true);
    }
  };
  const handleDeleteButton = (serverId) => {
    fetch('http://localhost:8080/shutdown', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ server: serverId })
    })
    .then(response => {
      if (response.ok) { console.log('Shutdown sent successfully'); } 
      else { console.error('Failed to send shutdown'); }
    })
    .catch(error => { console.error('Error:', error); });

    Servers.current.forEach(server => { if (server.status.current !== "sleep" && server.status.current !== "shutdown" && server.status.current !== "dead") { document.getElementById(`shutdown-button-${server.id}`).disabled = true; } });

    alert("Server will shutdown after it executes its current operation.");
  };
  const handleClockButton = () => {
    document.getElementById('clockButton').disabled = true;
    clock();
    setTimeout(() => { document.getElementById('clockButton').disabled = false; }, 1100);
  };
  const handleClockAuto = () => {
    if (document.getElementById('clockAuto').checked) {
      if (!AutoClockIntervalId) {
        document.getElementById('clockButton').disabled = true;
        AutoClockIntervalId = setInterval(() => { clock(); }, 1100);
      }
    } else {
      if (AutoClockIntervalId) {
        clearInterval(AutoClockIntervalId);
        AutoClockIntervalId = null;
        document.getElementById('clockButton').disabled = false;
      }
    }
  };
  const clock = () => {
    fetch('http://localhost:8080/clock', { method: 'POST', })
    .then(response => {
      if (response.ok) { 
        console.log('Clock signal sent successfully'); 
        if (UserRed.waitingMsg.current) {
          if (UserRed.waitingTime.current >= 20) { resetWaitingTime(UserRed, "red"); } 
          else { incrementWaitingTime(UserRed, "red"); }
        }
        if (UserBlue.waitingMsg.current) {
          if (UserBlue.waitingTime.current >= 20) { resetWaitingTime(UserBlue, "blue"); } 
          else { incrementWaitingTime(UserBlue, "blue"); }
        }
      } 
      else { console.error('Failed to send clock signal'); }
    })
    .catch(error => { console.error('Error:', error); });
  };
//-------------------------------------------------------------------------------------------------------------
  const updateTerminal = (data) => {
    const terminal = TerminalRef.current;
    const commands_array = data.events;
    commands_array.sort((a, b) => a.server - b.server);
    var line;

    line = document.createElement('div');
    line.className = 'terminal-line';
    line.textContent = `Time: ${data.time}`;
    terminal.appendChild(line);

    commands_array.forEach((cmd) => {
      line = document.createElement('div');
      line.className = 'terminal-line';
      line.textContent = `  Server: ${cmd.server} | Command: ${cmd.command}`;
      terminal.appendChild(line);

      if (cmd.arguments && Array.isArray(cmd.arguments)) {
        cmd.arguments.forEach(arg => {
          line = document.createElement('div');
          line.className = 'terminal-line';
          line.textContent = `    ${arg}`;
          terminal.appendChild(line);
        });
      }
    });

    line = document.createElement('div');
    line.className = 'terminal-line';
    line.textContent = `<-------------------------------------------------------------->`;
    terminal.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;
  };
  const updateReturn = (data) => {
    const terminal = OutputRef.current;
    var line;

    line = document.createElement('div');
    line.className = 'terminal-line';
    line.textContent = `Server: ${data.server},`;
    terminal.appendChild(line);

    line = document.createElement('div');
    line.className = 'terminal-line';
    line.textContent = `Storage: [`;
    terminal.appendChild(line);

    if (data.arguments && data.arguments.length != 0) {
      data.arguments.forEach(arg => {
        const parts = arg.split('|');
        const trimmed = parts.map(part => part.trim());

        line = document.createElement('div');
        line.className = 'terminal-line';
        line.textContent = `  { ${trimmed[0]}, ${trimmed[1]}, ${trimmed[2]}, ${trimmed[3]} },`;
        terminal.appendChild(line);
      });
    }

    line = document.createElement('div');
    line.className = 'terminal-line';
    line.textContent = `]`;
    terminal.appendChild(line);

    line = document.createElement('div');
    line.className = 'terminal-line';
    line.textContent = `<-------------------------------------------------------------->`;
    terminal.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;
  };
//-------------------------------------------------------------------------------------------------------------
  const put = async (command) => {
    if (SimError) return;

    const server = Servers.current.find(s => s.id === command.server);
    var line_in;
    var line_out_start = PutPath.find(s => s.id === server.putOUT);
    var line_out_end = getOutputPutLine(server.id);
    const value = getValue(command.arguments[0]);

    if (server.status.current === "head" || server.status.current === "head_tail" || server.status.current === "head_tail_old") { line_in = (value.user === "red") ? UserRed.line_in : UserBlue.line_in; } 
    else { line_in = PutPath.find(s => s.id === server.putIN); }

    const msg = line_in.messages.shift();
    if (msg === undefined) {
      SimError = true;
      return;
    }
    line_out_end.messages.push(msg);

    d3.select(`#${msg.id}`).transition().duration(500).attr('cx', server.x).attr('cy', server.y1).on('end', function() {
        d3.select(this).remove();

        saveValue(server, value, 'red');
        drawMessage(msg.id,  line_out_start.x1, line_out_start.y, value.user);
        moveMessage(msg.id, 500, line_out_end.x2 - (line_out_end.messages.length - 1) * 10, line_out_end.y);

        if (server.status.current !== "head" || server.status.current !== "head_tail" || server.status.current !== "head_tail_old") { line_in.messages.forEach(msg => { moveMessage(msg.id, 500, +Svg.select(`#${msg.id}`).attr("cx") + 10, Svg.select(`#${msg.id}`).attr("cy")); }); }
      });
  };
  const commit = async (command) => {
    if (SimError) return;

    const server = Servers.current.find(s => s.id === command.server);
    var line_in = CommitPath.find(s => s.id === server.commitIN);
    var line_out_start;
    var line_out_end;
    var original_head;
    const value = getValue(command.arguments[0]);

    if (server.status.current === "head" || server.status.current === "head_tail" || server.status.current === "head_tail_old") {
      line_out_end = (value.user === "red") ? UserRed.line_out : UserBlue.line_out;
      if (server.id === 0) {
        original_head = true;
        line_out_start = line_out_end;
      } else {
        original_head = false;
        line_out_start = CommitPath.find(s => s.id === server.commitOUT);
      }
    } else {
      line_out_start = CommitPath.find(s => s.id === server.commitOUT);
      line_out_end = getOutputCommitLine(server.id);
    }

    const msg = line_in.messages.shift();
    if (msg === undefined) {
      SimError = true;
      return;
    }
    line_out_end.messages.push(msg);

    d3.select(`#${msg.id}`).transition().duration(500).attr('cx', server.x).attr('cy', server.y1).on('end', function() {
        d3.select(this).remove();
        saveValue(server, value, 'green');

        if (server.status.current === "head" || server.status.current === "head_tail" || server.status.current === "head_tail_old") {
          if (original_head) { drawMessage(msg.id,  line_out_start.x1, line_out_start.y1, value.user); } 
          else { drawMessage(msg.id,  line_out_start.x1, line_out_start.y, value.user); }

          d3.select(`#${msg.id}`).transition().duration(500).attr('cx', line_out_end.x2).attr('cy', line_out_end.y2).on('end', function() {
              d3.select(this).remove();
              [document.getElementById(`${value.user}-key-input`), document.getElementById(`${value.user}-value-input`), document.getElementById(`${value.user}-send-button`)].forEach(el => el.disabled = false);
            });

          var user = (value.user === "red") ? UserRed : UserBlue;
          resetWaitingTime(user, value.user);
        } else {
          drawMessage(msg.id,  line_out_start.x1, line_out_start.y, value.user);
          moveMessage(msg.id, 500, line_out_end.x2 + (line_out_end.messages.length - 1) * 10, line_out_end.y);
        }

        line_in.messages.forEach(msg => { moveMessage(msg.id, 500, +Svg.select(`#${msg.id}`).attr("cx") - 10, Svg.select(`#${msg.id}`).attr("cy")); });
      });
  };
  const no_commit = async (command) => {
    if (SimError) return;

    const server = Servers.current.find(s => s.id === command.server);
    var line_in = CommitPath.find(s => s.id === server.commitIN);
    const msg = line_in.messages.shift();
    if (msg === undefined) {
      SimError = true;
      return;
    }

    d3.select(`#${msg.id}`).transition().duration(500).attr('cx', server.x).attr('cy', server.y1).on('end', function() {
        d3.select(this).remove();
        line_in.messages.forEach(msg => { moveMessage(msg.id, 500, +Svg.select(`#${msg.id}`).attr("cx") - 10, Svg.select(`#${msg.id}`).attr("cy")); });
      });
  };
  const tail = async (command) => {
    if (SimError) return;

    const server = Servers.current.find(s => s.id === command.server);
    var line_in;
    var line_out_start;
    var line_out_end;
    const value = getValue(command.arguments[0]);

    if (server.status.current === "head" || server.status.current === "head_tail" || server.status.current === "head_tail_old") { line_in = (value.user === "red") ? UserRed.line_in : UserBlue.line_in; } 
    else { line_in = PutPath.find(s => s.id === server.putIN); }

    if (server.status.current === "head" || server.status.current === "head_tail" || server.status.current === "head_tail_old") {
      line_out_end = (value.user === "red") ? UserRed.line_out : UserBlue.line_out;
      if (server.id === 0) { line_out_start = line_out_end; } 
      else { line_out_start = CommitPath.find(s => s.id === server.commitOUT); }
    } else {
      line_out_start = CommitPath.find(s => s.id === server.commitOUT);
      line_out_end = getOutputCommitLine(server.id);
    }

    const msg = line_in.messages.shift();
    if (msg === undefined) {
      SimError = true;
      return;
    }
    line_out_end.messages.push(msg);

    d3.select(`#${msg.id}`).transition().duration(500).attr('cx', server.x).attr('cy', server.y1).on('end', function() {
        d3.select(this).remove();
        saveValue(server, value, 'green');

        if (server.status.current === "head" || server.status.current === "head_tail" || server.status.current === "head_tail_old") { 
          if (server.id === 0) { drawMessage(msg.id,  line_out_start.x1, line_out_start.y1, value.user); }
          else { drawMessage(msg.id,  line_out_start.x1, line_out_start.y, value.user); }

          d3.select(`#${msg.id}`).transition().duration(500).attr('cx', line_out_end.x2).attr('cy', line_out_end.y2).on('end', function() {
              d3.select(this).remove();

              [document.getElementById(`${value.user}-key-input`), document.getElementById(`${value.user}-value-input`), document.getElementById(`${value.user}-send-button`)].forEach(el => el.disabled = false);
            });

          var user = (value.user === "red") ? UserRed : UserBlue;
          resetWaitingTime(user, value.user);
        } else {
          drawMessage(msg.id,  line_out_start.x1, line_out_start.y, value.user);
          moveMessage(msg.id, 500, line_out_end.x2 + (line_out_end.messages.length - 1) * 10, line_out_end.y);
        }

        if (server.status.current !== "head" || server.status.current !== "head_tail" || server.status.current !== "head_tail_old") { line_in.messages.forEach(msg => { moveMessage(msg.id, 500, +Svg.select(`#${msg.id}`).attr("cx") + 10, Svg.select(`#${msg.id}`).attr("cy")); }); }
      });
  };
  const ping = (command) => {
    if (SimError) return;

    const server = Servers.current.find(s => s.id === command.server);
    var line = PingPath.find(s => s.id === server.id);
    const id = `msg-${CurrentMsgId}`;
    CurrentMsgId++;
    const msg = { id: id };
    line.messages.push({ id: id });

    drawMessage(msg.id,  line.x, line.y2, 'green');
    moveMessage(msg.id, 1000, line.x, line.y1);
  };
  const pong = (command) => {
    if (SimError) return;

    const server = Servers.current.find(s => s.id === command.server);
    var line = PingPath.find(s => s.id === server.id);
    const msg = line.messages.shift();
    if (msg === undefined) {
      SimError = true;
      return;
    }

    d3.select(`#${msg.id}`).transition().duration(500).attr('cx', server.x).attr('cy', server.y1).on('end', function() {
        d3.select(this).remove();
        drawMessage(msg.id,  line.x, line.y1, 'green');

        d3.select(`#${msg.id}`).transition().duration(500).attr('cx', line.x).attr('cy', line.y2).on('end', function() {
            d3.select(this).remove();
          });
      });
  };
  const get_input = (command) => {
    if (SimError) return;

    const server = Servers.current.find(s => s.id === command.server);

    var line = GetInputPath.find(s => s.id === server.id);
    const msg = line.messages.shift();
    if (msg === undefined) {
      SimError = true;
      return;
    }

    d3.select(`#${msg.id}`).transition().duration(500).attr('cx', server.x).attr('cy', server.y1).on('end', function() {
        d3.select(this).remove();
        line.messages.forEach(msg => { moveMessage(msg.id, 500, Svg.select(`#${msg.id}`).attr("cx"), +Svg.select(`#${msg.id}`).attr("cy") - 10); });
      });
  };
  const get_return = (command) => {
    if (SimError) return;

    const server = Servers.current.find(s => s.id === command.server);
    var line = GetOutputPath.find(s => s.id === server.id);
    const id = `msg-${CurrentMsgId}`;
    CurrentMsgId++;
    const msg = { id: id };

    drawMessage(msg.id,  line.x, line.y1, 'orange');

    d3.select(`#${msg.id}`).transition().duration(1000).attr('cx', line.x).attr('cy', line.y2).on('end', function() {
        d3.select(this).remove();
      });

    [document.getElementById(`key-input-${server.id}`), document.getElementById(`read-button-${server.id}`)].forEach(el => el.disabled = false);

    updateReturn(command);
  };
  const ask = (command) => {
    if (SimError) return;

    const server = Servers.current.find(s => s.id === command.server);
    const tail = Servers.current.find(s => s.status.current === "tail" || s.status.current === "tail_old");
    var line = GetInputPath.find(s => s.id === tail.id);
    const id = `msg-${CurrentMsgId}`;
    CurrentMsgId++;
    line.messages.push({ id: id });

    drawMessage(id,  server.x, server.y1, 'yellow');
    moveMessage(id, 1000, line.x, line.y2 + ((line.messages.length - 1)) * 10);
  };
  const answered = (command) => {
    if (SimError) return;

    const server = Servers.current.find(s => s.id === command.server);
    const tail = Servers.current.find(s => s.status.current === "tail" || s.status.current === "tail_old");
    const id = `msg-${CurrentMsgId}`;
    CurrentMsgId++;

    drawMessage(id,  tail.x, tail.y1, 'yellow');
    
    d3.select(`#${id}`).transition().duration(1000).attr('cx', server.x).attr('cy', server.y1).on('end', function() { d3.select(this).remove(); });
  };
  const add = () => {
    if (SimError) return;

    const index = findNewServer();
    if (index === -1) {
      return;
    }
    const server = Servers.current.find(s => s.id === index);
    const tail = Servers.current.find(s => s.status.current === "tail" || s.status.current === "head_tail");

    changeServerStatus(server, "tail_new");
    drawServer(server, 'server_sync.svg');
    drawArrow(`put_line-${server.id - 1}`, PutPath[server.id - 1].x1, PutPath[server.id - 1].y, PutPath[server.id - 1].x2, PutPath[server.id - 1].y, "single");
    drawArrow(`commit_line-${server.id - 1}`, CommitPath[server.id - 1].x1, CommitPath[server.id - 1].y, CommitPath[server.id - 1].x2, CommitPath[server.id - 1].y, "single");

    fetch('http://localhost:8080/add', { method: 'POST', })
    .then(response => {
      if (response.ok) { console.log('Add signal sent successfully'); } 
      else { console.error('Failed to add signal'); }
    })
    .catch(error => { console.error('Error:', error); });

    [document.getElementById(`shutdown-button-${server.id}`), document.getElementById(`shutdown-button-${tail.id}`)].forEach(el => el.disabled = true);

    const add_button = document.getElementById("addButton");
    add_button.disabled = true;
    NumServers.current++;
  };
  const sendConfig = (command) => {
    if (SimError) return;

    const server = Servers.current.find(s => s.id === command.server);
    var line = ControlPath.find(s => s.id === server.id);
    const id = `msg-${CurrentMsgId}`;
    CurrentMsgId++;
    line.messages.push({ id: id, command: command.command });

    drawMessage(id, line.x, line.y2, 'white');
    moveMessage(id, 1000, line.x, line.y1);
  };
  const reciveConfig = (command) => {
    if (SimError) return;

    const server = Servers.current.find(s => s.id === command.server);
    const msg = ControlPath.find(s => s.id === server.id).messages.shift();
    if (msg === undefined) {
      SimError = true;
      return;
    }

    d3.select(`#${msg.id}`).transition().duration(500).attr('cx', server.x).attr('cy', server.y1).on('end', function() {
        d3.select(this).remove();

        if (msg.command === "send_change_config(New_head)") { //DONE
          changeServerStatus(server, (NumServers.current > 1) ? "head" : "head_tail");
          UserRed.line_in.messages.forEach(msg => { d3.select(`#${msg.id}`).remove(); });
          UserBlue.line_in.messages.forEach(msg => { d3.select(`#${msg.id}`).remove(); });
        } else if (msg.command === "send_change_config(New_tail)") { //Spremeni za line_in/out
          changeServerStatus(server, (NumServers.current > 1) ? "tail" : "head_tail");
          PutPath.find(s => s.id === server.putOUT).messages.forEach(msg => { d3.select(`#${msg.id}`).remove(); });
          CommitPath.find(s => s.id === server.commitIN).messages.forEach(msg => { d3.select(`#${msg.id}`).remove(); });
        } else if (msg.command === "send_change_config(New_next)") { //DONE
          const line_put_old = PutPath.find(s => s.id === server.putOUT);
          const line_put_new = getOutputPutLine(server.id);
          line_put_old.messages.forEach(msg => { line_put_new.messages.push(msg); moveMessage(msg.id, 500, line_put_new.x2 - ((line_put_new.messages.length - 1)) * 10, line_put_new.y);});
          line_put_old.messages.length = 0;
        } else if (msg.command === "send_change_config(New_prev)") { //DONE
          const line_commit_old = CommitPath.find(s => s.id === server.commitOUT);
          const line_commit_new = getOutputCommitLine(server.id);
          line_commit_old.messages.forEach(msg => { line_commit_new.messages.push(msg); moveMessage(msg.id, 500, line_commit_new.x2 + ((line_commit_new.messages.length - 1)) * 10, line_commit_new.y); });
          line_commit_old.messages.length = 0;
        } else if (msg.command === "send_change_config(Sync_new_tail)") { //DONE
          changeServerStatus(server, (server.status.current === "head_tail") ? "head_tail_old" : "tail_old");
        } else if (msg.command === "send_change_config(Confirm_new_tail)") {
          if (server.status.current === "tail_new") {
            const tail = Servers.current.find(s => s.id === getOldTail(server.id));
            changeServerStatus(server, "tail");
            document.getElementById("addButton").disabled = NumServers.current >= Servers.current.length;
            document.getElementById(`shutdown-button-${server.id}`).disabled = false;
            d3.select(`#image-${command.server}`).attr('xlink:href', 'server_on.svg');
            const line_old = GetInputPath.find(s => s.id === tail.id);
            const line_new = GetInputPath.find(s => s.id === server.id);
            for (let j = 0; j < line_old.messages.length; j++) {
              const remainingMsg = line_old.messages.shift();
              if (remainingMsg === undefined) {
                SimError = true;
                return;
              }
              line_new.messages.push(remainingMsg);
              moveMessage(remainingMsg.id, 500, +Svg.select(`#${remainingMsg.id}`).attr("cx") + 150 * (server.id - tail.id), Svg.select(`#${remainingMsg.id}`).attr("cy"));
            }
          } else if (server.status.current === "tail_old" || server.status.current === "head_tail_old") { //DONE
            changeServerStatus(server, (server.status.current === "head_tail_old") ? "head" : "middle");
            document.getElementById(`shutdown-button-${server.id}`).disabled = false;
          }
        }
      });
  };
  const syncSend = (command) => {
    if (SimError) return;

    const server = Servers.current.find(s => s.id === command.server);
    var line_start = PutPath.find(s => s.id === server.putOUT);
    var line_end = getOutputPutLine(server.id);
    var color;
    const id = `msg-${CurrentMsgId}`;
    CurrentMsgId++;
    line_end.messages.push({ id: id });

    if (command.arguments[0] === "sync_done") { color = "purple"; } 
    else { color = getValue(command.arguments[0]).user; }

    drawMessage(id, line_start.x1, line_start.y, color);
    moveMessage(id, 1000, line_end.x2 - (line_end.messages.length - 1) * 10, line_end.y);
  };
  const syncRecive = (command) => {
    if (SimError) return;

    const server = Servers.current.find(s => s.id === command.server);
    var line = PutPath.find(s => s.id === server.putIN);
    const msg = line.messages.shift();
    if (msg === undefined) {
      SimError = true;
      return;
    }

    d3.select(`#${msg.id}`).transition().duration(500).attr('cx', server.x).attr('cy', server.y1).on('end', function() {
        d3.select(this).remove();

        if (command.arguments[0] != "sync_done") { saveValue(server, getValue(command.arguments[0]), 'green'); }
      });
  };
  const confirmSync = (command) => {
    if (SimError) return;

    const server = Servers.current.find(s => s.id === command.server);
    var line_start = CommitPath.find(s => s.id === server.commitOUT);
    var line_end = getOutputCommitLine(server.id);
    const id = `msg-${CurrentMsgId}`;
    CurrentMsgId++;
    line_end.messages.push({ id: id });

    drawMessage(id, line_start.x1, line_start.y, 'purple');
    moveMessage(id, 1000, line_end.x2, line_end.y);
  };
  const reciveConfirmSync = (command) => {
    if (SimError) return;

    const server = Servers.current.find(s => s.id === command.server);
    var line = CommitPath.find(s => s.id === server.commitIN);
    const msg = line.messages.shift();
    if (msg === undefined) {
      SimError = true;
      return;
    }

    d3.select(`#${msg.id}`).transition().duration(500).attr('cx', server.x).attr('cy', server.y1).on('end', function() { d3.select(this).remove(); });
  };
  const syncDone = (command) => {
    if (SimError) return;

    const server = Servers.current.find(s => s.id === command.server);
    var line = ControlPath.find(s => s.id === server.id);
    const id = `msg-${CurrentMsgId}`;
    CurrentMsgId++;

    drawMessage(id, line.x, line.y1, 'white');

    d3.select(`#${id}`).transition().duration(1000).attr('cx', line.x).attr('cy', line.y2).on('end', function() { d3.select(this).remove(); });
  };
  const shutdown = (command) => {
    if (SimError) return;

    const server = Servers.current.find(s => s.id === command.server);
    changeServerStatus(server, "shutdown");
    NumServers.current--;
    d3.select(`#image-${command.server}`).attr('xlink:href', 'server_off.svg');
  };
  const confirmShutdown = (command) => {
    if (SimError) return;

    const server = Servers.current.find(s => s.id === command.server);
    changeServerStatus(server, "dead");

    [PingPath.find(s => s.id === command.server), ControlPath.find(s => s.id === command.server), GetInputPath.find(s => s.id === command.server), GetOutputPath.find(s => s.id === command.server)].forEach(el => el.messages.forEach(msg => { d3.select(`#${msg.id}`).remove(); }));
    [d3.select(`#ping_line-${server.id}`), d3.select(`#control_line-${server.id}`), d3.select(`#get_input_line-${server.id}`), d3.select(`#get_output_line-${server.id}`), d3.select(`#key_input-${server.id}`), d3.select(`#read_button-${server.id}`), d3.select(`#shutdown_button-${server.id}`)].forEach(el => {if (!el.empty()) { el.remove(); }});
    
    document.getElementById(`storage-terminal-${server.id}`).innerHTML = '';
    d3.select(`#storage-${server.id}`).remove();

    Servers.current.forEach(server => { if (server.status.current !== "sleep" && server.status.current !== "shutdown" && server.status.current !== "dead" && server.status.current !== "tail_new" && server.status.current !== "tail_old" && NumServers.current > 1) { document.getElementById(`shutdown-button-${server.id}`).disabled = false; } });
  };
  const tailConfirm = (command) => {
    if (SimError) return;

    const server = Servers.current.find(s => s.id === command.server);
    const line = getOutputCommitLine(server.id);
    const value = getValue(command.arguments[0]);
    saveValue(server, value, 'green');
    const id = `msg-${CurrentMsgId}`;
    CurrentMsgId++;
    line.messages.push({ id: id });

    drawMessage(id, line.x1, line.y, value.user);
    moveMessage(id, 500, line.x2 + (line.messages.length - 1) * 10, line.y);
  };
//-------------------------------------------------------------------------------------------------------------
  return (
    <div>
      <div>
        <svg ref={Ref}></svg>
      </div>
      <div className="button-div">
        <button id="fetchButton" className="button-conf" onClick={fetchServers} disabled={Loaded}>Get configuration</button>
        <button id="clockButton" className="button-clock" onClick={handleClockButton} disabled={!Loaded}>Clock
          <svg xmlns="http://www.w3.org/2000/svg" className="button-icon" viewBox="0 0 512 512">
            <path d="M256 0a256 256 0 1 1 0 512A256 256 0 1 1 256 0zM232 120l0 136c0 8 4 15.5 10.7 20l96 64c11 7.4 25.9 4.4 33.3-6.7s4.4-25.9-6.7-33.3L280 243.2 280 120c0-13.3-10.7-24-24-24s-24 10.7-24 24z"/>
          </svg>
        </button>
        <label className="input-checkbox-container">Auto-clock
          <input id="clockAuto" type="checkbox" className="input-checkbox" onChange={handleClockAuto} disabled={!Loaded}/>
          <span className="input-checkbox-checkmark"></span>
        </label>
        <button id="resetButton" className="button-reset" onClick={resetSimulation} disabled={!Loaded}>Reset
          <svg xmlns="http://www.w3.org/2000/svg" className="button-icon" viewBox="0 0 512 512">
            <path d="M125.7 160l50.3 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L48 224c-17.7 0-32-14.3-32-32L16 64c0-17.7 14.3-32 32-32s32 14.3 32 32l0 51.2L97.6 97.6c87.5-87.5 229.3-87.5 316.8 0s87.5 229.3 0 316.8s-229.3 87.5-316.8 0c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0c62.5 62.5 163.8 62.5 226.3 0s62.5-163.8 0-226.3s-163.8-62.5-226.3 0L125.7 160z"/>
          </svg>
        </button>
        <button id="addButton" className="button-add" onClick={add} disabled={!Loaded || NumServers.current >= Servers.current.length}>Add
        <svg xmlns="http://www.w3.org/2000/svg" className="button-icon" viewBox="0 0 448 512">
          <path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 144L48 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l144 0 0 144c0 17.7 14.3 32 32 32s32-14.3 32-32l0-144 144 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-144 0 0-144z"/>
        </svg>
        </button>
      </div>
      <div className="terminal-container">
        <div className="left-terminal" ref={OutputRef}></div>
        <div className="right-terminal" ref={TerminalRef}></div>
      </div>
    </div>
  );
};

export default Visualization;