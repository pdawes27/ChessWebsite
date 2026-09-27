import {useEffect} from 'react';
import './settings.css';

function resetSettings(props) {
    document.querySelector('.ays').classList.remove('open-ays');
    localStorage.removeItem('boardColor');
    props.setBoardColor('classic');
}

function Settings(props) {
    const {boardColor, setBoardColor} = props;

    useEffect(() => {
        localStorage.setItem('boardColor', boardColor);
    }, [boardColor]);

    return (
        <div className="backSettings">
            <div><h1>Settings</h1></div>
            <div>
                <p>Chess Board Color: {boardColor}</p>
                <form>
                    <label>
                        Board Color:
                        <select value={boardColor} onChange={(e) => setBoardColor(e.target.value)}>
                            <option value="classic">Classic</option>
                            <option value="utk">UTK</option>
                            <option value="earth">Earth</option>
                        </select>
                    </label>
                </form>
            </div>
            <div>
                <label>Reset to Default</label>
                <button onClick={() => document.querySelector('.ays').classList.add('open-ays')}>Reset</button>
                <div className="ays">
                    <button className="aysexit" onClick={() => document.querySelector('.ays').classList.remove('open-ays')}>X</button>
                    <p>Are you sure you want to reset settings?</p>
                    <button className="aysbtn" onClick={() => resetSettings(props)}>Reset</button>
                </div>
            </div>
        </div>
    )
}

export default Settings;