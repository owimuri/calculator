"use client"

import {
  useState,
  useEffect,
  useCallback
} from "react"
import {
  Volume2,
  VolumeX,
  History,
  Settings,
  X
} from "lucide-react"

interface ICalculationHistory {
  expression: string
  result: string
  timestamp: number
}

const translations = {
  ru: {
    calculator: "КАЛЬКУЛЯТОР",
    history: "ИСТОРИЯ",
    settings: "НАСТРОЙКИ",
    sound: "ЗВУК",
    theme: "ТЕМА",
    language: "ЯЗЫК",
    light: "СВЕТЛАЯ",
    dark: "ТЁМНАЯ",
    clear: "ОЧИСТИТЬ",
    clearHistory: "ОЧИСТИТЬ ИСТОРИЮ",
    noHistory: "ИСТОРИЯ ПУСТА",
    on: "ВКЛ",
    off: "ВЫКЛ",
    error: "ОШИБКА"
  },
  eng: {
    calculator: "CALCULATOR",
    history: "HISTORY",
    settings: "SETTINGS",
    sound: "SOUND",
    theme: "THEME",
    language: "LANGUAGE",
    light: "LIGHT",
    dark: "DARK",
    clear: "CLEAR",
    clearHistory: "CLEAR HISTORY",
    noHistory: "NO HISTORY",
    on: "ON",
    off: "OFF",
    error: "ERROR"
  }
}

export default function Calculator() {
  const [display, setDisplay] = useState("0")
  const [expression, setExpression] = useState("")
  const [history, setHistory] = useState<ICalculationHistory[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [calcSettings, setCalcSettings] = useState({
    soundEnabled: true,
    theme: "light" as "light" | "dark",
    language: "ru" as "ru" | "eng"
  })
  const [displayAnimation, setDisplayAnimation] = useState(false)
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)
  const [lastResult, setLastResult] = useState<number | null>(null)
  const t = translations[calcSettings.language]

  useEffect(() => {
    const savedSettings = localStorage.getItem("calculator-settings")
    const savedHistory = localStorage.getItem("calculator-history")

    if (savedSettings) {
      try {
        setCalcSettings(JSON.parse(savedSettings))
      }
      catch (e) {
        console.error("ошибка загрузки настроек: ", e)
      }
    }
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory))
      }
      catch (e) {
        console.error("ошибка загрузки истории: ", e)
      }
    }
  }, [])
  useEffect(() => {
    localStorage.setItem("calculator-settings", JSON.stringify(calcSettings))
  }, [calcSettings])
  useEffect(() => {
    localStorage.setItem("calculator-history", JSON.stringify(history))
  }, [history])
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const key = event.key

      if (/[0-9+\-*/=.()%]/.test(key) || key === "Enter" || key === "Escape" || key === "Backspace") event.preventDefault()
      if (/[0-9]/.test(key)) {
        highlightKey(key)
        inputNumber(key)
      }
      else if (key === "+") {
        highlightKey("+")
        inputOperator("+")
      }
      else if (key === "-") {
        highlightKey("−")
        inputOperator("-")
      }
      else if (key === "*") {
        highlightKey("×")
        inputOperator("*")
      }
      else if (key === "/") {
        highlightKey("÷")
        inputOperator("/")
      }
      else if (key === "(") {
        highlightKey("(")
        inputParenthesis("(")
      }
      else if (key === ")") {
        highlightKey(")")
        inputParenthesis(")")
      }
      else if (key === "%") {
        highlightKey("%")
        inputPercent()
      }
      else if (key === "." || key === ",") {
        highlightKey(".")
        inputNumber(".")
      }
      else if (key === "Enter" || key === "=") {
        highlightKey("=")
        performCalculation()
      }
      else if (key === "Escape") {
        highlightKey("C")
        clear()
      }
      else if (key === "Backspace") {
        highlightKey("⌫")
        backspace()
      }
    }

    window.addEventListener("keydown", handleKeyPress)

    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [display, expression, isError, lastResult, t.error])

  const playSound = useCallback(() => {
    if (!calcSettings.soundEnabled) return

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)

      oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.1)
    }
    catch (e) {
      console.error("ошибка воспроизведения звука: ", e)
    }
  }, [calcSettings.soundEnabled])
  const animateDisplay = () => {
    setDisplayAnimation(true)
    setTimeout(() => setDisplayAnimation(false), 200)
  }
  const highlightKey = (key: string) => {
    setActiveKey(key)
    setTimeout(() => setActiveKey(null), 150)
  }
  const safeEvaluate = (expr: string): number => {
    try {
      const jsExpression = expr.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-")

      if (!/^[0-9+\-*/().\s]+$/.test(jsExpression)) throw new Error("недопустимые символы")

      let openCount = 0

      for (const char of jsExpression) {
        if (char === "(") openCount++
        if (char === ")") openCount--
        if (openCount < 0) throw new Error("скобки не совпадают")
      }

      if (openCount !== 0) throw new Error("скобки не совпадают")

      const result = new Function("return " + jsExpression)()

      if (!isFinite(result)) throw new Error("недопустимый результат")

      return result
    }
    catch (error) {
      throw new Error("ошибка вычислений")
    }
  }
  const inputCharacter = (char: string) => {
    playSound()
    animateDisplay()
    setIsError(false)

    if (display === "0" && /[0-9]/.test(char)) {
      setDisplay(char)
      setExpression(char)
    } 
    else if (display === t.error) {
      if (/[0-9]/.test(char)) {
        setDisplay(char)
        setExpression(char)
      }
    }
    else {
      const newExpression = expression + char

      setExpression(newExpression)

      if (/[0-9.]/.test(char)) {
        const matches = newExpression.match(/[0-9.]+$/g)
        
        if (matches)setDisplay(matches[0])
      }
      else {
        const lastNumber = newExpression.match(/[0-9.]+$/g)
        if (lastNumber) setDisplay(lastNumber[0])
        else setDisplay(char)
      }
    }
  }
  const inputNumber = (num: string) => {
    inputCharacter(num)
  }
  const inputOperator = (op: string) => {
    const displayOp = op === "*" ? "×" : op === "/" ? "÷" : op === "-" ? "−" : op

    inputCharacter(displayOp)
  }
  const inputParenthesis = (paren: string) => {
    playSound()
    animateDisplay()
    setIsError(false)

    if (display === t.error) {
      if (paren === "(") {
        setDisplay("(")
        setExpression("(")
      }

      return
    }

    const newExpression = expression + paren

    setExpression(newExpression)
    setDisplay(paren)
  }
  const inputPercent = () => {
    playSound()
    animateDisplay()
    setIsError(false)

    if (display === t.error || display === "0") return

    try {
      const currentValue = Number.parseFloat(display)

      if (lastResult !== null && /[×÷+−]$/.test(expression.replace(/\s/g, ""))) {
        const percentValue = (lastResult * currentValue) / 100
        const newExpression = expression + percentValue.toString()

        setExpression(newExpression)
        setDisplay(percentValue.toString())
      }
      else {
        const percentValue = currentValue / 100

        setDisplay(percentValue.toString())
        setExpression(percentValue.toString())
      }
    }
    catch (error) {
      setDisplay(t.error)
      setExpression("")
      setIsError(true)
    }
  }
  const performCalculation = () => {
    playSound()
    animateDisplay()

    if (!expression || expression === "0") return

    try {
      const result = safeEvaluate(expression)
      const resultStr = String(result)
      const newHistoryItem: ICalculationHistory = {
        expression: expression,
        result: resultStr,
        timestamp: Date.now()
      }

      setHistory((prev) => [newHistoryItem, ...prev.slice(0, 19)])
      setDisplay(resultStr)
      setExpression(resultStr)
      setLastResult(result)
      setIsError(false)
    }
    catch (error) {
      setDisplay(t.error)
      setExpression("")
      setIsError(true)
      setLastResult(null)
    }
  }
  const clear = () => {
    playSound()
    animateDisplay()
    setDisplay("0")
    setExpression("")
    setIsError(false)
    setLastResult(null)
  }
  const backspace = () => {
    playSound()
    animateDisplay()

    if (isError || display === t.error) {
      clear()

      return
    }
    if (expression.length <= 1) {
      clear()

      return
    }

    const newExpression = expression.slice(0, -1)

    setExpression(newExpression)

    if (newExpression === "") setDisplay("0")
    else {
      const lastNumber = newExpression.match(/[0-9.]+$/g)

      if (lastNumber) setDisplay(lastNumber[0])
      else {
        const lastChar = newExpression.slice(-1)

        setDisplay(lastChar)
      }
    }
  }
  const clearHistory = () => {
    playSound()
    setHistory([])
  }
  const toggleSound = () => {
    setCalcSettings((prev) => ({
      ...prev,
      soundEnabled: !prev.soundEnabled
    }))

    if (!calcSettings.soundEnabled) playSound()
  }
  const toggleTheme = () => {
    setCalcSettings((prev) => ({
      ...prev,
      theme: prev.theme === "light" ? "dark" : "light"
    }))
    playSound()
  }
  const toggleLanguage = () => {
    setCalcSettings((prev) => ({
      ...prev,
      language: prev.language === "ru" ? "eng" : "ru"
    }))
    playSound()
  }
  const buttons = [{
    label: "C",
    action: clear,
    className: "button-danger",
    key: "C"
  }, {
    label: "⌫",
    action: backspace,
    className: "button-secondary",
    key: "⌫"
  }, {
    label: "%",
    action: inputPercent, 
    className: "button-secondary",
    key: "%"
  }, {
    label: "÷",
    action: () => inputOperator("/"),
    className: "button-operator",
    key: "÷"
  }, {
    label: "7",
    action: () => inputNumber("7"),
    className: "button-number",
    key: "7"
  }, {
    label: "8",
    action: () => inputNumber("8"), 
    className: "button-number", 
    key: "8" 
  }, { 
    label: "9", 
    action: () => inputNumber("9"), 
    className: "button-number", 
    key: "9" 
  }, {
    label: "×",
    action: () => inputOperator("*"),
    className: "button-operator", 
    key: "×"
  }, {
    label: "4", 
    action: () => inputNumber("4"), 
    className: "button-number", 
    key: "4" 
  }, { 
    label: "5", 
    action: () => inputNumber("5"), 
    className: "button-number", 
    key: "5" 
  }, { 
    label: "6", 
    action: () => inputNumber("6"), 
    className: "button-number", 
    key: "6" 
  }, { 
    label: "−", 
    action: () => inputOperator("-"), 
    className: "button-operator", 
    key: "−" 
  }, { 
    label: "1", 
    action: () => inputNumber("1"), 
    className: "button-number", 
    key: "1" 
  }, { 
    label: "2", 
    action: () => inputNumber("2"), 
    className: "button-number", 
    key: "2" 
  }, { 
    label: "3", 
    action: () => inputNumber("3"), 
    className: "button-number", 
    key: "3" 
  }, { 
    label: "+", 
    action: () => inputOperator("+"), 
    className: "button-operator", 
    key: "+" 
  }, { 
    label: "(", 
    action: () => inputParenthesis("("), 
    className: "button-secondary", 
    key: "(" 
  }, { 
    label: "0", 
    action: () => inputNumber("0"), 
    className: "button-number", 
    key: "0"
  }, { 
    label: ")", 
    action: () => inputParenthesis(")"), 
    className: "button-secondary", 
    key: ")" 
  }, { 
    label: ".", 
    action: () => inputNumber("."), 
    className: "button-number", 
    key: "." 
  }, { label: "=", 
    action: performCalculation, 
    className: "col-span-4 button-equals",
    key: "="
  }]

  return (<div className = {`min-h-screen p-4 transition-all duration-500 ${calcSettings.theme === "dark" ? "theme-dark" : "theme-light"}`}>
    <div className = "fixed inset-0 overflow-hidden pointer-events-none">
      <div className = "absolute inset-0 opacity-20">
        {
          [...Array(30)].map((_, i) => (<div key = {
            i
          } className = "absolute dot animate-float" style = {
            {
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }
          } />))
        }
      </div>
    </div>
    <div className = "max-w-md mx-auto relative z-10">
      <div className = "flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold pixel-text animate-glow">{
          t.calculator
        }</h1>
        <div className = "flex gap-2">
          <button onClick = {
            () => setShowHistory(!showHistory)
          } className = "icon-button" aria-label = {
            t.history
          }>
            <History className = "w-5 h-5" />
          </button>
          <button onClick = {
            () => setShowSettings(!showSettings)
          } className = "icon-button" aria-label = {
            t.settings
          }>
            <Settings className = "w-5 h-5" />
          </button>
        </div>
      </div>

      {
        showSettings && (<div className = "panel mb-6 animate-slide-down">
          <div className = "flex items-center justify-between mb-4">
            <h3 className = "pixel-text text-lg">{
              t.settings
            }</h3>
            <button onClick = {
              () => setShowSettings(false)
            } className = "icon-button">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className = "space-y-4">
            <div className = "flex items-center justify-between">
              <span className="pixel-text flex items-center gap-2">{
                calcSettings.soundEnabled ? <Volume2 className = "w-4 h-4" /> : <VolumeX className = "w-4 h-4" />
              }{
                t.sound
              }</span>
              <button onClick = {
                toggleSound
              } className = "toggle">
                {
                calcSettings.soundEnabled ? t.on : t.off
                }
              </button>
            </div>
            <div className = "flex items-center justify-between">
              <span className = "pixel-text">{
                t.theme
              }</span>
              <button onClick = {
                toggleTheme
              } className = "toggle">
                {
                  calcSettings.theme === "light" ? t.light : t.dark
                }
              </button>
            </div>
            <div className = "flex items-center justify-between">
              <span className = "pixel-text">{
                t.language
              }</span>
              <button onClick = {
                toggleLanguage
              } className = "toggle">
                {
                  calcSettings.language === "ru" ? "RU" : "ENG"
                }
              </button>
            </div>
          </div>
        </div>)
      }
      {
        showHistory && (<div className = "panel mb-6 animate-slide-down">
          <div className = "flex items-center justify-between mb-4">
            <h3 className = "pixel-text text-lg">{
              t.history
            }</h3>
            <div className = "flex gap-2">
              <button onClick = {
                clearHistory
              } className = "button-small">
                {
                  t.clearHistory
                }
              </button>
              <button onClick = {
                () => setShowHistory(false)
              } className = "icon-button">
                <X className = "w-4 h-4" />
              </button>
            </div>
          </div>
          <div className = "max-h-40 overflow-y-auto space-y-2">
            {
              history.length === 0 ? (<p className = "pixel-text text-sm opacity-60">{
                t.noHistory
              }</p>) : (history.map((item, index) => (<div key = {
                index
              } className = "history-item animate-fade-in">
                <div className = "pixel-text text-sm">
                  {
                    item.expression
                  } = {
                    item.result
                  }
                </div>
              </div>)))
            }
          </div>
        </div>)
      }

      <div className = "calculator animate-bounce-in">
        <div className = {
          `display ${
            displayAnimation ? "animate-flash" : ""
          } ${
            isError ? "display-error" : ""
          }`
        }>
          <div className = "pixel-text text-sm text-right mb-2 min-h-6 flex items-center justify-end opacity-70">
            {
              expression || " "
            }
          </div>
          <div className = {
            `pixel-text text-3xl text-right min-h-12 flex items-center justify-end ${
              isError ? "text-red-400" : ""
            }`
          }>
            {
              display
            }
          </div>
        </div>
        <div className = "grid grid-cols-4 gap-3 mt-4">
          {
            buttons.map((button, index) => (<button key = {
              index
            } onClick = {
              button.action
            } className = {
              `h-14 pixel-text text-xl font-bold ${
                button.className
              } ${
                activeKey === button.key ? "button-keyboard-active" : ""
              } animate-press`
            }>
              {
                button.label
              }
            </button>))
          }
        </div>
      </div>
    </div>
  </div>)
}