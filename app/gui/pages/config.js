import TitleBar from '../components/title-bar'
import { Field, Tip, Input, Checkbox, Textarea, Button } from '../components/form'
import { prompt } from './prompt'
import { execSync } from 'child_process'

@autobind
class Config extends Component {
  componentWillMount () {
    let useLocalProxy = false
    //if (isOsX) {
    //  execSync('networksetup -getwebproxy Wi-Fi')
    //}
    this.setState({ store: eventBus.store, useLocalProxy })
    eventBus.on('store', this.onStoreChange)
  }

  componentWillUnmount () {
    eventBus.removeListener('store', this.onStoreChange)
  }

  onStoreChange () {
    this.setState({ store: eventBus.store })
  }

  onSetVal (val, shallow = false) {
    fetch(`${serviceAddr}/app-data${shallow ? '?shallow' : ''}`, {
      method: 'PUT',
      body: JSON.stringify(val)
    })
  }

  onAddHeader (field) {
    const title = ({
      injectRequestHeaders: '注入请求头',
      injectResponseHeaders: '注入响应头'
    })[field]
    prompt({ title, mode: 'kv' })
    .then(r => {
      r.key = r.key.trim()
      r.value = r.value.trim()
      if (r.key && r.value) {
        const oVal = this.state.store[field]
        const val = {}
        Object.keys(oVal).concat(r.key).sort().forEach((key) => {
          val[key] = oVal[key] || ''
        })
        val[r.key] = r.value
        this.onSetVal({ [field]: val }, true)
      }
    })
    .catch(err => null)
  }
  
  onEditHeader (field, key, oVal) {
    const defaultValue = { key, value: oVal }
    const title = ({
      injectRequestHeaders: '注入请求头',
      injectResponseHeaders: '注入响应头'
    })[field]
    prompt({ title, mode: 'kv', defaultValue })
    .then(r => {
      r.key = r.key.trim()
      r.value = r.value.trim()
      if (r.key && r.value) {
        const oVal = { ...this.state.store[field] }
        delete oVal[key]
        const val = {}
        Object.keys(oVal).concat(r.key).sort().forEach((key) => {
          val[key] = oVal[key] || ''
        })
        val[r.key] = r.value
        this.onSetVal({ [field]: val }, true)
      }
    })
  }
  
  onRemoveHeader (field, key) {
    const val = { ...this.state.store[field] }
    delete val[key]
    this.onSetVal({ [field]: val }, true)
  }

  onUseLocalPorxy (val) {
    
  }

  @CSS({
    '.section': {
      padding: 5,
      marginBottom: 10,
      background: '#FFF',
      '&:hover': {
        '.title': {
          color: '#333'
        }
      },
      '.title': {
        paddingBottom: 5,
        marginBottom: 5,
        color: '#777',
        transition: 'color 0.3s',
        borderBottom: '1px solid #EEE'
      },
      '.half': {
        display: 'inline-block',
        width: '48%',
        '&.right': {
          marginLeft: '3.9%'
        }
      },
      '.checkbox': {
        width: 130,
        marginBottom: 9
      }
    },
    '.config': {
      display: 'flex',
      flexFlow: 'column',
      height: '100%',
      '.title-bar': {
        flex: 'none'
      },
      '.wrap': {
        flex: 'auto',
        padding: 5,
        overflow: 'hidden'
      }
    },
    '.header': {
      display: 'flex',
      flexFlow: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      '.kv': {
        flex: 'auto',
        '.key, .value': {
          display: 'inline-block',
          verticalAlign: 'middle',
          width: '47%',
          fontSize: 11,
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          whiteSpace: 'nowrap'
        },
        '.colon': {
          '&::after': {
            content: '":"', 
          },
          display: 'inline-block',
          width: '5%',
          verticalAlign: 'middle',
          textAlign: 'center',
          fontSize: 11
        }
      },
      '.control': {
        flex: 'none',
      }
    }
  })
  render () {
    const { store, useLocalProxy } = this.state
    if (!store || !store.config) {
      return (
        <div className="config">
          <div className="title-bar">
            <TitleBar title="正在等待代理服务器启动" noMinimize={true} noMaximize={true}></TitleBar>
          </div>
        </div>
      )
    }
    const bindConfig = name => ({
      defaultValue: store.config[name],
      onChange: val => this.onSetVal({ config: { [name]: val } })
    })
    return (
      <div className="config">
        <div className="title-bar">
          <TitleBar title="设置" noMinimize={true} noMaximize={true}></TitleBar>
        </div>
        <div className="wrap">
          <div className="section">
            <div className="title">基本设置</div>
            {false ? (
              <Field labelWidth={100} label="代理端口" tip="需要重启 Vodo 才可生效">
                <Input type="number" min="1" {...bindConfig('port')} />
              </Field>
            ) : null}
            <Field labelWidth={100} label="请求大小上限" tip={<span>MB <Tip>如果某个请求的传输内容超过设置的大小，该请求只会记录最基本的信息</Tip></span>}>
              <Input type="number" min="1" {...bindConfig('singleRequestLimit')} />
            </Field>
            <Field labelWidth={100} label="总记录容量" tip={<span>MB <Tip>抓包记录是存在内存里的，超出设置的容量会开始丢弃最早的记录</Tip></span>}>
              <Input type="number" min="10" {...bindConfig('allRequestLimit')} />
            </Field>
          </div>
          <div className="section">
            <div className="title">开关</div>
            <Checkbox {...bindConfig('recordRequest')}>记录请求</Checkbox>
            {null && <Checkbox {...bindConfig('simulateUnstableNetwork')}>模拟不稳定网络</Checkbox>}
            {null && <Checkbox {...bindConfig('simulateSlowNetwork')}>模拟慢速网速</Checkbox>}
            {null && <Checkbox value={useLocalProxy} onChange={this.onUseLocalPorxy}>抓取我的{isOsX ? 'Mac' : 'PC'}</Checkbox>}
            <Checkbox {...bindConfig('ignoreHTTPS')}>忽略HTTPS</Checkbox>
          </div>
          <div className="section">
            <div className="title">注入JS脚本</div>
            <Textarea defaultValue={store.htmlInjectScript} onChange={val => this.onSetVal({ htmlInjectScript: val })} rows="6"></Textarea>
          </div>
          {null && (
            <div className="section">
              <div className="title">注入请求头</div>
              {Object.keys(store.injectRequestHeaders).map(key => {
                const value = store.injectRequestHeaders[key]
                return (
                  <div className="header" key={key}>
                    <div className="kv">
                      <div className="key" title={key}>
                        {key}
                      </div>
                      <div className="colon" />
                      <div className="value" title={value}>
                        {value}
                      </div>
                    </div>
                    <div className="control">
                      <Button onClick={() => this.onEditHeader('injectRequestHeaders', key, value)}>编辑</Button>
                      <Button onClick={() => this.onRemoveHeader('injectRequestHeaders', key)} style={{ backgroundColor: '#D33' }}>删除</Button>
                    </div>
                  </div>
                )
              })}
              <Button onClick={() => this.onAddHeader('injectRequestHeaders')}>添加</Button>
            </div>
          )}
          {null && (
            <div className="section">
              <div className="title">注入响应头</div>
              {Object.keys(store.injectResponseHeaders).map(key => {
                const value = store.injectResponseHeaders[key]
                return (
                  <div className="header" key={key}>
                    <div className="kv">
                      <div className="key" title={key}>
                        {key}
                      </div>
                      <div className="colon" />
                      <div className="value" title={value}>
                        {value}
                      </div>
                    </div>
                    <div className="control">
                      <Button onClick={() => this.onEditHeader('injectResponseHeaders', key, value)}>编辑</Button>
                      <Button onClick={() => this.onRemoveHeader('injectResponseHeaders', key)} style={{ backgroundColor: '#D33' }}>删除</Button>
                    </div>
                  </div>
                )
              })}
              <Button onClick={() => this.onAddHeader('injectResponseHeaders')}>添加</Button>
            </div>
          )}
        </div>
      </div>
    )
  }
}

export default Config

let openedWin = null
export const open = () => {
  if (openedWin) {
    openedWin.then(win => {
      win.focus()
    })
  } else {
    const options = {
      width: 500,
      height: 430,
      resizable: false
    }
    openedWin = new Promise(resolve => {
      openUI('config', options, (win) => {
        win.on('close', () => {
          win.close(true)
          openedWin = null
        })
        resolve(win)
      })
    })
  }
}
