import React, { useState } from "react";

// import { requestJira } from "@forge/bridge";

const inputStyle = {
  width: "100%",
  padding: "10px",
  border: "1px solid #ccc",
  borderRadius: "4px",
  boxSizing: "border-box",
};

const labelStyle = {
  display: "block",
  marginBottom: "5px",
};

const containerStyle = {
  fontFamily: "Arial, sans-serif",
  padding: "20px",
  maxWidth: "600px",
  margin: "0 auto",
};

const sectionStyle = {
  marginBottom: "20px",
};

export const request = (url) =>
  new Promise((resolve, reject) => {
    const start = performance.now();

    window.AP.request(url, {
      contentType: "application/json",
      method: "GET",
      success: () => {
        const end = performance.now();

        console.log(`Request to ${url} took ${end - start} ms`);

        resolve(end - start);
      },
      reject: (error) => {
        reject(error);
      },
    });
  });

const App = () => {
  const [url, setUrl] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [numberOfRequests, setNumberOfRequests] = useState(1);
  const [executionTime, setExecutionTime] = useState(0);
  const [responseTimes, setResponseTimes] = useState([]);

  const handleClick = async () => {
    setExecutionTime(0);
    setIsExecuting(true);
    window.performance.mark("start");

    const requests = Array.from({ length: numberOfRequests }, () =>
      request(url, { type: "GET" })
    );
    const times = await Promise.all(requests);
    setResponseTimes(times);

    window.performance.mark("end");
    window.performance.measure("total", "start", "end");
    const total = window.performance.getEntriesByName("total");

    setExecutionTime(total[0].duration);
    setIsExecuting(false);
  };

  return (
    <div style={containerStyle}>
      <div style={sectionStyle}>
        <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
          AP.request() performance test
        </h1>
        <label style={labelStyle}>
          Get URL path, e.g. <i>/rest/api/3/myself</i>
        </label>
        <input
          type="text"
          onChange={(e) => setUrl(e.target.value)}
          style={inputStyle}
        />
      </div>
      <div style={sectionStyle}>
        <label style={labelStyle}>Number of requests</label>
        <input
          type="number"
          onChange={(e) => setNumberOfRequests(Number(e.target.value))}
          style={inputStyle}
        />
      </div>
      <button onClick={handleClick}>Execute</button>
      {isExecuting && (
        <div style={{ marginTop: "20px", color: "#007bff" }}>
          Running parallel requests...
        </div>
      )}
      <div style={{ marginTop: "20px" }}>
        <strong>Response times (ms):</strong>
        <ul>
          {responseTimes.map((time, index) => (
            <li key={index}>
              Request {index + 1}: {time.toFixed(2)} ms
            </li>
          ))}
        </ul>
      </div>
      <div style={{ marginTop: "20px" }}>
        <strong>Total execution time:</strong>{" "}
        {(executionTime / 1000).toFixed(2)} s
      </div>
    </div>
  );
};

export default App;
