
import React, { Component } from 'react';
import { Col, Form, Row, Table } from 'react-bootstrap';

export class MainView extends Component {
    static defaultProps = {
    };

    constructor(props) {
        super(props);

        this.state = {
            submissionText: "",
        };

        this.criteriaList = [
            {text: 'Traitement', color: "#FFFF00", backgroundColor: "#FFFFE0"},
            {text: 'Organisation', color: "#00FF00", backgroundColor: "#E0FFE0"},
            {text: 'Style/Syntaxe', color: "#00FFFF", backgroundColor: "#E0FFFF"},
            {text: 'Orthographe', color: "#FF00FF", backgroundColor: "#FFE0FF"},
        ];

        this.levelList = ['A', 'B', 'C', 'D', 'E'];
    }

    componentDidMount(){
        this.setState({submissionText: window.IWrapper.getContent()});
    }

    render() {
        let main =
            <Row className='p-3'>
                <Col lg={7}>
                    <h3>Production de l'élève</h3>
                    <div className='p-3'  dangerouslySetInnerHTML={{__html: this.state.submissionText}}></div>
                </Col>
                <Col lg={5}>
                    <h3>Évaluation</h3>
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                            <th>Critère</th>
                            {this.levelList.map((item, index) => {
                                return <th key={index}>{item}</th>;
                            })}
                            <th>Erreurs</th>
                            </tr>
                        </thead>
                        <tbody>
                            {this.criteriaList.map((item, index) => {
                                let row = 
                                    <tr key={index} style={{backgroundColor: item.backgroundColor}}>
                                        <td style={{backgroundColor: item.color}}>{item.text}</td>
                                        {this.levelList.map((item2, index2) => {
                                            return <td key={index2}>{item2}</td>;
                                        })}
                                        <td>0</td>
                                    </tr>;
                                return row;
                            })}
                        </tbody>
                    </Table>
                    
                    <Form.Group controlId="exampleForm.ControlTextarea1">
                        <Form.Label>Rétroaction générale:</Form.Label>
                        <Form.Control placeholder="Ajouter une rétroaction générale à l'élève..." as="textarea" rows={5} />
                    </Form.Group>
                </Col>
                
            </Row>

        return (main);
    }
}