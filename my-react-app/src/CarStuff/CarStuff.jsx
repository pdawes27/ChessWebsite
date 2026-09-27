import { useState } from "react";
import './CarStuff.css';
import { openPopup, closePopup } from "./CarStuff.js";

const initialInfo = {
  color: "Red",
  brand: "Wagon"
}

function Coloring(props) {
  const { color, setColor } = props;
  const [curr, setCurr] = useState("");

  function handleChange(event) {
    setCurr(event.target.value);
  }

  function handleSubmit(event) {
    event.preventDefault();
    setColor(curr);
    setCurr("");
  }

  return (
    <div className="else">
      <form onSubmit={handleSubmit}>
        <label>Choose a color: </label>
        <input type="text" value={curr} onChange={handleChange} /> 
        <label />
        <input type="submit" />
      </form>
      <button type="submit" className="btn" onClick={openPopup}>
        Color
      </button>
      <div className="popup" id="popup">
        <p>This is a Pop-up</p>
        <button type="submit" onClick={closePopup}>
          Ok
        </button>
      </div>
    </div>
  )
}

function isColor(color) {
    const s = new Option().style;
    s.color = color;
    return s.color !== "";
}

function Car(obj) {
  let validcolor = new Option().style.color;
  if (isColor(obj.info.color)) {
    validcolor = obj.info.color;
  } else {
    validcolor = "black";
  }

  return (
    <div>
      <h1 className="um">I am a <span style={{color: validcolor}}>{obj.info.color}</span> {obj.info.brand}!</h1>
      <h1 style={{backgroundColor: "black", padding: "5px", margin: "0px"}}></h1>
    </div>
  );
}

function CarStuff(props) {
  const [color, setColor] = useState("");
  const info = {...initialInfo, color};

  return (
    <div>
      <Car info={info} />
      <Coloring color={color} setColor={setColor} />
    </div>
  );
}

export default CarStuff;