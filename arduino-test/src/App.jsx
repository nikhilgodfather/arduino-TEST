import React, { useState, useEffect, useRef } from "react";

const App = () => {
  const [port, setPort] = useState(null);
  const [command, setCommand] = useState("");
  const [dataLog, setDataLog] = useState([]);
  const logContainerRef = useRef(null);

  // Function to Connect to Arduino via Web Serial API
  const connectSerial = async () => {
    try {
      if ("serial" in navigator) {
        const newPort = await navigator.serial.requestPort(); // Prompt user to select device
        await newPort.open({ baudRate: 115200 }); // Open serial connection
        setPort(newPort);
        readSerialData(newPort); // Start reading data
        console.log("✅ Connected to Arduino!");

        // Add connection info to log
        setDataLog((prevLog) => [
          ...prevLog,
          {
            type: "System",
            message: "Connected to Arduino successfully",
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      } else {
        alert("❌ Web Serial API not supported in this browser.");
      }
    } catch (error) {
      console.error("❌ Serial Connection Error:", error);
      setDataLog((prevLog) => [
        ...prevLog,
        {
          type: "Error",
          message: `Connection failed: ${error.message}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }
  };

  // Buffer to accumulate partial messages
  const messageBuffer = useRef("");

  // Function to Read Data from Arduino
  const readSerialData = async (serialPort) => {
    try {
      const reader = serialPort.readable.getReader();

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          reader.releaseLock();
          break;
        }

        // Decode the received data
        const receivedText = new TextDecoder().decode(value);

        // Append to our buffer
        messageBuffer.current += receivedText;

        // Check if we have complete lines (ending with newline character)
        if (messageBuffer.current.includes("\n")) {
          // Split by newlines
          const lines = messageBuffer.current.split("\n");

          // The last element might be incomplete if it doesn't end with newline
          messageBuffer.current = lines.pop() || "";

          // Process complete lines
          for (const line of lines) {
            if (line.trim()) {
              // Only add non-empty lines
              setDataLog((prevLog) => [
                ...prevLog,
                {
                  type: "Arduino",
                  message: line.trim(),
                  timestamp: new Date().toLocaleTimeString(),
                },
              ]);
            }
          }
        }
      }
    } catch (error) {
      console.error("❌ Read Error:", error);
      setDataLog((prevLog) => [
        ...prevLog,
        {
          type: "Error",
          message: `Read error: ${error.message}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }
  };

  // Function to Send Data to Arduino
  const sendSerialData = async () => {
    if (!port) {
      alert("❌ Connect to Arduino first!");
      return;
    }
    if (!command.trim()) {
      alert("❌ Please enter a command!");
      return;
    }

    try {
      const writer = port.writable.getWriter();
      await writer.write(new TextEncoder().encode(command + "\n"));
      writer.releaseLock();
      console.log("📤 Sent:", command);

      // Log sent command
      setDataLog((prevLog) => [
        ...prevLog,
        {
          type: "You",
          message: command,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);

      // Clear input after sending
      setCommand("");
    } catch (error) {
      console.error("❌ Write Error:", error);
      setDataLog((prevLog) => [
        ...prevLog,
        {
          type: "Error",
          message: `Failed to send: ${error.message}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }
  };

  // Handle Enter key press in the input field
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      sendSerialData();
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [dataLog]);

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        maxWidth: "800px",
        margin: "0 auto",
        padding: "20px",
      }}
    >
      <h1 style={{ textAlign: "center" }}>Arduino Serial Communication</h1>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <button
          onClick={connectSerial}
          style={{
            padding: "10px 15px",
            fontSize: "16px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          🔌 Connect to Arduino
        </button>

        <div style={{ display: "flex", flexGrow: 1, marginLeft: "20px" }}>
          <input
            type="text"
            placeholder="Enter command..."
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyPress={handleKeyPress}
            style={{
              padding: "10px",
              fontSize: "16px",
              flexGrow: 1,
              borderRadius: "4px 0 0 4px",
              border: "1px solid #ccc",
            }}
          />
          <button
            onClick={sendSerialData}
            style={{
              padding: "10px 15px",
              fontSize: "16px",
              backgroundColor: "#2196F3",
              color: "white",
              border: "none",
              borderRadius: "0 4px 4px 0",
              cursor: "pointer",
            }}
          >
            📤 Send
          </button>
        </div>
      </div>

      <div style={{ marginTop: "20px" }}>
        <h2>📩 Communication Log</h2>
        <div
          ref={logContainerRef}
          style={{
            border: "1px solid #ddd",
            borderRadius: "4px",
            padding: "10px",
            backgroundColor: "#f8f8f8",
            height: "300px",
            overflowY: "auto",
            fontFamily: "monospace",
          }}
        >
          {dataLog.length === 0 ? (
            <p style={{ color: "#888", textAlign: "center" }}>
              No communication yet. Connect to Arduino and start sending
              commands.
            </p>
          ) : (
            dataLog.map((log, index) => {
              let bgColor = "#f8f8f8";
              let textColor = "#333";

              // Style based on message type
              switch (log.type) {
                case "You":
                  bgColor = "#e3f2fd";
                  textColor = "#0d47a1";
                  break;
                case "Arduino":
                  bgColor = "#e8f5e9";
                  textColor = "#1b5e20";
                  break;
                case "Error":
                  bgColor = "#ffebee";
                  textColor = "#c62828";
                  break;
                case "System":
                  bgColor = "#fffde7";
                  textColor = "#616161";
                  break;
                default:
                  break;
              }

              return (
                <div
                  key={index}
                  style={{
                    padding: "8px",
                    margin: "4px 0",
                    backgroundColor: bgColor,
                    color: textColor,
                    borderRadius: "4px",
                    borderLeft: `4px solid ${textColor}`,
                  }}
                >
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <strong>{log.type}</strong>
                    <span style={{ fontSize: "0.8em", color: "#666" }}>
                      {log.timestamp}
                    </span>
                  </div>
                  <div style={{ marginTop: "4px", wordBreak: "break-word" }}>
                    {log.message}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
