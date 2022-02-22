import React from 'react'

import './App.css';
import { wordListEN } from './WordleWordsEN.js'
import { wordListFIN } from './WordleWordsFIN.js'
import { GameState } from './constants/gamestate'
import AmericanFlag from './assets/AmericanFlag.png'
import FinnishFlag from './assets/FinnishFlag.png'

function resizeTimer(fn, ms) 
{
    let timer
    return _ => {
        clearTimeout(timer)
        timer = setTimeout(_ => {
            timer = null
            fn.apply(this, arguments)
        }, ms)
    };
}

function wordNumReducer(state, action)
{
    switch(action.type) {
        case "letter++":
            return {curLetterIdx: state.curLetterIdx + 1, curWordIdx: state.curWordIdx};
        case "letter--":
            return {curLetterIdx: state.curLetterIdx - 1, curWordIdx: state.curWordIdx};
        case "word++":
            return {curLetterIdx: state.curLetterIdx, curWordIdx: state.curWordIdx + 1};
        case "word--":
            return {curLetterIdx: state.curLetterIdx, curWordIdx: state.curWordIdx - 1};
        case "reset_letter":
            return {curLetterIdx: 0, curWordIdx: state.curWordIdx};
        case "reset":
            return {curLetterIdx: 0, curWordIdx: 0};
        default:
            throw new Error();
    }
}


function App() {
    const keyboardKeys = [
        "q","w","e","r","t","y","u","i","o","p",
        "a","s","d","f","g","h","j","k","l",
        "z","x","c","v","b","n","m", "ö", "ä", "å", "<-"
    ] 

    const [dimensions, setDimensions] = React.useState({
        height: window.innerHeight,
        width: window.innerWidth
    });

    const initialLettersDict = {
        letters: {
            "word1": ["","","","",""],
            "word2": ["","","","",""],
            "word3": ["","","","",""], 
            "word4": ["","","","",""],
            "word5": ["","","","",""],
            "word6": ["","","","",""]
        }
    }

    const isPageLoaded = React.useState(0)

    //TODO:: Use reducer
    const [lettersDict, setLetters] = React.useState(initialLettersDict);

    const [gameState, setGameState] = React.useState(GameState.WRITING);
    const [wordState, setWordState] = React.useReducer(wordNumReducer, {curLetterIdx: 0, curWordIdx: 0});
    const [infoText, setInfoText] = React.useState("");
    const [correctWord, setCorrectWord] = React.useState(0);
    const [isGameInitialized, setGameInitialized] = React.useState(0);
    const [langState, setLangState] = React.useState("EN");
    const [oldLangState, setOldLangState] = React.useState("EN");
    const [wordsList, setWordsList] = React.useState([])
    const [onMobile, setOnMobile] = React.useState(false)
    const domLetterGrid = React.useRef([]);
    const domKeyboardGrid = React.useRef([]);
    const domRestartBtn = React.useRef(null);
    const langBtnEN = React.useRef(null);
    const langBtnFIN = React.useRef(null);

    const handleReset = (e) => 
    {
        init()
    }

    const init = () => 
    {
        console.log("Init called with lang: " + langState);
        const randomNumber = Math.floor(Math.random() * wordsList.length)
        if(wordsList === [])
            setWordsList(wordListEN[0]["words"])
        console.log(wordsList[0])

        setCorrectWord(wordsList[randomNumber])
        setWordState({type: "reset"})
        setLetters(initialLettersDict)
        setInfoText("")
        setGameState(GameState.WRITING)
        domRestartBtn.current.className = 'app-hidden'
        domLetterGrid.current.forEach((val, idx) => {
            val.className = 'app-input-field'
        })
        domKeyboardGrid.current.forEach((val, idx) => {
            val.className = 'app-keyboard-key'
        })
    }

    const loseGame = () => 
    {
        console.log("Game lost")
        setGameState(GameState.LOST)
        setInfoText("You lost the game. The word was: " + correctWord)
        domRestartBtn.current.className = "app-restart-button"
    }

    const handleKeyPress = (key) => 
    {
        console.log(key)
        if(gameState === GameState.WRITING)
        {
            if(wordState.curLetterIdx < 5)
                setInfoText("")
            if(keyboardKeys.includes(key))
            {
                if(wordState.curLetterIdx < 5)
                {
                    //Apply the letter to the current word
                    const wordKey = Object.keys(lettersDict.letters)[wordState.curWordIdx]
                    changeLettersArray(wordKey, wordState.curLetterIdx, key)
                    setWordState({type: "letter++"})
                }
            }
            
            if(key === "Backspace" || key === "&lt;-")
            {
                const wordKey = Object.keys(lettersDict.letters)[wordState.curWordIdx]
                changeLettersArray(wordKey, wordState.curLetterIdx-1, "")
                if(wordState.curLetterIdx > 0)
                   setWordState({type: "letter--"}) 
            }
            else if(key === "Enter" || wordState.curLetterIdx === 4)
            {
                setGameState(GameState.APPLYING);
                applyCurWord();
            }
        }
    }

    const keyPressedHandler = ({key}) => 
    {
        handleKeyPress(key)
    }

    const handleKeyboardClick = (e) => 
    {
        var keyPressed = "";
        if(e.target.innerHTML.includes("<p>"))
            keyPressed = e.target.innerHTML.replace("<p>", "").replace("</p>", "")
        else
            keyPressed = e.target.innerHTML
        handleKeyPress(keyPressed)
    }

    const changeLettersArray = (wordKey, letterIdx, newLetter) => 
    {
        var temp = lettersDict
        temp.letters[wordKey][letterIdx] = newLetter
        setLetters({...lettersDict, temp})
    }

    const applyCurWord = () => 
    {
        //Apply the word and do a check
        const letters = lettersDict.letters[Object.keys(lettersDict.letters)[wordState.curWordIdx]]
        const word = letters.join(',').replaceAll(',', '')
        console.log(word + ":" + correctWord)
        if(wordsList.includes(word))
        {
            //Check if the word was correct, or if it was partly correct
            if(correctWord === word)
            {
                setGameState(GameState.VICTORY)
                for(let i = 0; i < correctWord.length; i++)
                {
                    domLetterGrid.current[wordState.curWordIdx * 5 + i].className = 'app-input-field-right'
                    domKeyboardGrid.current[keyboardKeys.indexOf(correctWord[i])].className = 'app-keyboard-key-right'
                }
                //Show victory screen and return
                setInfoText("You won the game!")
                domRestartBtn.current.className = 'app-restart-button'
                return
            }
            else if(correctWord.split("").some(r => word.split("").includes(r)))
            {
                //Part of the word was right
                //Check which letters were right, and their indices in both arrays
                //Play animation depending if the indices match or not

                const corWordList = correctWord.split("")
                const ourWordList = word.split("")

                //Iterate letters in our input word
                ourWordList.forEach(function (oletter, i) {
                    //Check if the letter is same index in both words
                    if(corWordList[i] === ourWordList[i])
                    {
                        domLetterGrid.current[(wordState.curWordIdx * 5) + i].className = 'app-input-field-right'
                        domKeyboardGrid.current[keyboardKeys.indexOf(oletter)].className = 'app-keyboard-key-right'
                    }
                    //Check if the letter is in the word
                    else if(corWordList.includes(oletter))
                    {
                        domLetterGrid.current[(wordState.curWordIdx * 5) + i].className = 'app-input-field-partly-right'
                        let kKey = domKeyboardGrid.current[keyboardKeys.indexOf(oletter)] 
                        if(kKey.className !== "app-keyboard-key-right")
                            kKey.className = 'app-keyboard-key-partly-right'
                    }
                    //Otherwise mark is as "wrong letter"
                    else
                    {
                        domLetterGrid.current[(wordState.curWordIdx * 5) + i].className = 'app-input-field-wrong'
                        let kKey = domKeyboardGrid.current[keyboardKeys.indexOf(oletter)] 
                        if(kKey.className !== "app-keyboard-key-right")
                            kKey.className = 'app-keyboard-key-wrong'
                    }
                })

                //NOTE:: To mimic the original, we could buffer these animations

            }
            else
            {
                for(let i = 0; i < word.length; i++)
                {
                    domLetterGrid.current[wordState.curWordIdx * 5 + i].className = 'app-input-field-wrong'
                }
            }
            
            setWordState({type: "word++"}) 
            setWordState({type: "reset_letter"})
        }
        else
        {
            //Word was not in the dictionary!
            setInfoText("Word was not in the dictionary")
        }
        if(wordState.curWordIdx === 5)
        {
            //Game lost
            setGameState(GameState.DEFEAT)
            loseGame()
        }
        setGameState(GameState.WRITING);
    }


    React.useEffect(() => {
        //TODO:: USE useReducer OR useCallback instead of useEffect for this to reduce amount of subscriptions
        const timedHandleWinResize = resizeTimer(function handleWinResize() {
            setDimensions({
                height: window.innerHeight,
                width: window.innerWidth
            })
        }, 50)

        window.addEventListener('resize', timedHandleWinResize)
        window.addEventListener('keyup', keyPressedHandler)

        return _ => {
            window.removeEventListener('resize', timedHandleWinResize)
            window.removeEventListener('keyup', keyPressedHandler)
        }
    }, [wordState.curLetterIdx, wordState.curWordIdx, gameState]);

    React.useEffect(() => {
        handleLangBtnState()
        if(isGameInitialized === false)
        {
            init();
            setGameInitialized(true)
        }
    }, [isGameInitialized])

    React.useEffect(() => {
        setWordsList(wordListEN[0]["words"])
        setGameInitialized(false)
    }, []);

    React.useEffect(() => {
        if(dimensions.width > 1200 && dimensions.height > 850)
            setOnMobile(true)
        else
            setOnMobile(false)
    }, [dimensions]);

    React.useEffect(() => {
        if(oldLangState !== langState)
        {
            console.log("Changed")
            if(langState === "EN")
            {
                setWordsList(wordListEN[0]["words"])
            }
            else
            {
                setWordsList(wordListFIN[0]["words"])
            }
            setOldLangState(langState)
            setGameInitialized(false)
        }
    }, [langState]);

    const handleLangBtnState = () => 
    {
        switch(langState)
        {
            case "EN":
                langBtnEN.current.className = "app-nav-bar-btn-img-active"
                langBtnFIN.current.className = "app-nav-bar-btn-img"
                break;
            case "FIN":
                langBtnFIN.current.className = "app-nav-bar-btn-img-active"
                langBtnEN.current.className = "app-nav-bar-btn-img"
                break;
            default:
                langBtnEN.current.className = "app-nav-bar-btn-img-active"
                langBtnFIN.current.className = "app-nav-bar-btn-img"
                break;
        }
    }

    return (
        <div className="App">
           <div className="app-nav-bar-container">
               <div className="app-nav-bar-btn-container">
                   <button 
                       onClick={() => {console.log("Clicked"); setLangState("EN")}}
                       className="app-nav-bar-btn"
                       style={{
                            width: (onMobile ? (dimensions.width*0.05) : (dimensions.width*0.1)).toString() + "px",
                            height: (onMobile ? (dimensions.height*0.05) : (dimensions.height*0.1)).toString() + "px",
                       }}
                   >
                       <img ref={langBtnEN} onClick={() => {setLangState("EN");}} className="app-nav-bar-btn-img" src={AmericanFlag} alt="FIN"/>
                   </button>
                   <button
                       onClick={() => {setLangState("FIN")}}
                       className="app-nav-bar-btn"
                       style={{
                            width: (onMobile ? (dimensions.width*0.05) : (dimensions.width*0.1)).toString() + "px",
                            height: (onMobile ? (dimensions.height*0.05) : (dimensions.height*0.1)).toString() + "px",
                       }}
                   >
                       <img ref={langBtnFIN} onClick={() => {setLangState("FIN");}} className="app-nav-bar-btn-img" src={FinnishFlag} alt="FIN"/>
                   </button>
               </div>
               <div className="app-nav-bar-header"
                   style={{
                       fontSize: (onMobile ? (dimensions.width*0.01) : (dimensions.width*0.01)).toString() + "px",
                   }}
               >
                   <h1>
                       DefinitlyNotTheWordGame 
                   </h1>
               </div>
           </div>
           <div className="app-input-fields-container"
                style={{
                    width: (onMobile ? (dimensions.width/4.6) : (dimensions.width/0.6)).toString() + "px",
                    height: (onMobile ? (dimensions.height/2) : (dimensions.height/2.3)).toString() + "px",
                }}>
               <div className="app-input-fields-wrapper">
                   {
                       Object.keys(lettersDict.letters).map((key) => 
                           {
                               return(
                                   lettersDict.letters[key].map((values, index) => {
                                       return(
                                           <div 
                                               ref={el => domLetterGrid.current[(parseInt(key.slice(key.length-1, key.length))- 1) * 5 + index] = el}
                                               key={key + index}
                                               style={{
                                                   fontSize: (onMobile ? (dimensions.width*0.015) : (dimensions.width*0.025)).toString() + "px",
                                               }}
                                               className="app-input-field"
                                           >
                                               <p>
                                                   {values}
                                               </p>
                                           </div>
                                       );
                                   })
                               );
                           })
                   }
               </div>
               <div className="app-input-fields-info-container">
                   <div className="app-input-fields-info-wrapper">
                       <div className="app-input-fields-info-color"
                            style={{
                                background: 'green',
                            }}>
                       </div>
                       <p 
                        className="app-input-fields-info-text"
                        style={{fontSize: (onMobile ? dimensions.width*0.01 : dimensions.width*0.01).toString() + "px"}}
                       >
                           Correct letter and position
                       </p>
                   </div>
                   <div className="app-input-fields-info-wrapper">
                       <div className="app-input-fields-info-color"
                            style={{
                                background: 'yellow',
                            }}>
                       </div>
                       <p 
                        className="app-input-fields-info-text"
                        style={{fontSize: (onMobile ? dimensions.width*0.01 : dimensions.width*0.01).toString() + "px"}}
                       >
                           Correct letter but wrong position
                       </p>
                   </div>
                   <div className="app-input-fields-info-wrapper">
                       <div className="app-input-fields-info-color"
                            style={{
                                background: 'grey',
                            }}>
                       </div>
                       <p 
                        className="app-input-fields-info-text"
                        style={{fontSize: (onMobile ? dimensions.width*0.01 : dimensions.width*0.01).toString() + "px"}}
                       >
                           Wrong letter 
                       </p>
                   </div>
               </div>
           </div>
           <div className="app-info-text-container">
              <p
                   style={{
                       fontSize: ((dimensions.width > 800 && dimensions.height > 850) ? (dimensions.width*0.015) : (dimensions.width*0.025)).toString() + "px",
                   }}
               >
                  {infoText}
              </p>
              <button ref={domRestartBtn} onClick={handleReset} className="app-hidden">Play again!</button>
           </div>
           <div 
                className="app-keyboard-container"
                style={{
                    width: (onMobile ? (dimensions.width*0.3) : (dimensions.width*0.5)).toString() + "px",
                    height: (onMobile ? (dimensions.height*0.2) : (dimensions.height*0.2)).toString() + "px",
                }}
            >

               <ul className="app-keyboard-wrapper">
                   {
                       keyboardKeys.map((key, idx) => 
                           {
                               return(
                                   <li ref={el => domKeyboardGrid.current[idx] = el}
                                   onClick={handleKeyboardClick}
                                   key={"keyboard:" + key}
                                   style={{
                                       fontSize: (onMobile ? (dimensions.width*0.015) : (dimensions.width*0.025)).toString() + "px",
                                   }}
                                   className="app-keyboard-key">
                                       <p>
                                           {key}
                                       </p>
                                   </li>
                               );
                           }
                       )
                   }
               </ul>
           </div>
            
        </div>
    );

}


export default App;
