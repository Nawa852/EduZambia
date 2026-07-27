
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { GitBranch, Plus, Download, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface MindMapNode {
  id: string;
  text: string;
  x: number;
  y: number;
  level: number;
  parentId?: string;
}

const VisualMindMapBuilder = () => {
  const [nodes, setNodes] = useState<MindMapNode[]>([
    { id: '1', text: 'Main Topic', x: 400, y: 200, level: 0 }
  ]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [newTopicInput, setNewTopicInput] = useState('');
  const { toast } = useToast();

  const addNode = useCallback((parentId: string, text: string) => {
    const parent = nodes.find(n => n.id === parentId);
    if (!parent) return;

    const childrenCount = nodes.filter(n => n.parentId === parentId).length;
    const angle = (childrenCount * 60) - 30; // Spread children around parent
    const distance = 150;
    
    const newNode: MindMapNode = {
      id: Date.now().toString(),
      text,
      x: parent.x + Math.cos(angle * Math.PI / 180) * distance,
      y: parent.y + Math.sin(angle * Math.PI / 180) * distance,
      level: parent.level + 1,
      parentId
    };

    setNodes(prev => [...prev, newNode]);
  }, [nodes]);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId && n.parentId !== nodeId));
  }, []);

  const startEditing = (nodeId: string, currentText: string) => {
    setEditingNode(nodeId);
    setEditText(currentText);
  };

  const saveEdit = () => {
    if (editingNode) {
      setNodes(prev => prev.map(n => 
        n.id === editingNode ? { ...n, text: editText } : n
      ));
      setEditingNode(null);
      setEditText('');
    }
  };

  const generateAIMindMap = async () => {
    if (!newTopicInput.trim()) {
      toast({
        title: "No Topic",
        description: "Please enter a topic to generate a mind map.",
        variant: "destructive",
      });
      return;
    }

    // Simulate AI generation
    const aiNodes = [
      { text: 'Subtopic 1', level: 1 },
      { text: 'Subtopic 2', level: 1 },
      { text: 'Subtopic 3', level: 1 },
      { text: 'Detail A', level: 2 },
      { text: 'Detail B', level: 2 },
    ];

    const newNodes: MindMapNode[] = [
      { id: 'main', text: newTopicInput, x: 400, y: 200, level: 0 }
    ];

    aiNodes.forEach((aiNode, index) => {
      const parentId = aiNode.level === 1 ? 'main' : 'node-1';
      const angle = (index * 72) - 36;
      const distance = aiNode.level === 1 ? 150 : 100;
      
      newNodes.push({
        id: `node-${index + 1}`,
        text: aiNode.text,
        x: 400 + Math.cos(angle * Math.PI / 180) * distance,
        y: 200 + Math.sin(angle * Math.PI / 180) * distance,
        level: aiNode.level,
        parentId
      });
    });

    setNodes(newNodes);
    setNewTopicInput('');
    
    toast({
      title: "Mind Map Generated",
      description: "AI has created a comprehensive mind map for your topic.",
    });
  };

  const exportMindMap = () => {
    const mindMapData = JSON.stringify(nodes, null, 2);
    const blob = new Blob([mindMapData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mindmap.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            AI Visual Mind Map Builder
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Enter a topic for AI to build a mind map..."
              value={newTopicInput}
              onChange={(e) => setNewTopicInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && generateAIMindMap()}
            />
            <Button onClick={generateAIMindMap}>Generate AI Map</Button>
            <Button variant="outline" onClick={exportMindMap}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          <div className="relative w-full h-96 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50">
            <svg className="w-full h-full">
              {/* Draw connections */}
              {nodes.map(node => {
                if (!node.parentId) return null;
                const parent = nodes.find(n => n.id === node.parentId);
                if (!parent) return null;
                
                return (
                  <line
                    key={`line-${node.id}`}
                    x1={parent.x}
                    y1={parent.y}
                    x2={node.x}
                    y2={node.y}
                    stroke="#3b82f6"
                    strokeWidth="2"
                  />
                );
              })}
              
              {/* Draw nodes */}
              {nodes.map(node => (
                <g key={node.id}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="30"
                    fill={node.level === 0 ? "#3b82f6" : "#60a5fa"}
                    stroke="#1e40af"
                    strokeWidth="2"
                    className="cursor-pointer"
                    onClick={() => setSelectedNode(node.id)}
                  />
                  <text
                    x={node.x}
                    y={node.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="12"
                    className="pointer-events-none"
                  >
                    {node.text.length > 8 ? node.text.slice(0, 8) + '...' : node.text}
                  </text>
                </g>
              ))}
            </svg>

            {/* Node controls */}
            {selectedNode && (
              <div className="absolute top-2 right-2 bg-white p-2 rounded shadow-lg space-x-2">
                <Button
                  size="sm"
                  onClick={() => {
                    const text = prompt('Enter subtopic:');
                    if (text) addNode(selectedNode, text);
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const node = nodes.find(n => n.id === selectedNode);
                    if (node) startEditing(selectedNode, node.text);
                  }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteNode(selectedNode)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {editingNode && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex gap-2">
                <Input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                />
                <Button onClick={saveEdit}>Save</Button>
                <Button variant="outline" onClick={() => setEditingNode(null)}>Cancel</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VisualMindMapBuilder;
